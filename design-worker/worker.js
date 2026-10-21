/**
 * Shower configurator — enquiry handler.
 *
 * Receives a completed design and emails it to the workshop with the plan and
 * elevation drawings attached, plus a copy to the customer.
 *
 * Built as a Cloudflare Worker to match customshowers-contact, which is what
 * the site's existing quote form already posts to. There is no pricing
 * anywhere in this flow — the glazier quotes from the measurements.
 *
 * Secrets (Workers & Pages → customshowers-design → Settings → Variables):
 *   RESEND_API_KEY        required
 *   TURNSTILE_SECRET_KEY  required in production; skipped if unset
 *   BUSINESS_EMAIL        optional, defaults to sales@customshowers.uk
 *   FROM_EMAIL            optional, defaults to noreply@customshowers.uk
 */

/** Bump when the code changes, so a browser visit shows which paste is live. */
const WORKER_VERSION = "v12";

/**
 * CORS configuration. Allow production domain and Cloudflare Pages preview origins.
 * Preview origins follow the pattern: *.customshowers-website-bfs.pages.dev
 */
const ALLOWED_ORIGINS = [
  "https://customshowers.uk",
  "https://www.customshowers.uk",
  // Cloudflare Pages preview branches (regex pattern)
  /^https:\/\/[a-z0-9-]+\.customshowers-website-bfs\.pages\.dev$/,
];

function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigin = isOriginAllowed(origin) ? origin : "https://customshowers.uk";
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

function isOriginAllowed(origin) {
  if (!origin) return false;
  
  // Check exact matches
  if (ALLOWED_ORIGINS.some(allowed => typeof allowed === 'string' && allowed === origin)) {
    return true;
  }
  
  // Check regex patterns
  if (ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp && allowed.test(origin))) {
    return true;
  }
  
  return false;
}

/**
 * Destinations are allow-listed per tenant rather than taken from the request.
 * This endpoint is public and embedded on third-party sites, so a caller must
 * not be able to aim the mail relay at an arbitrary inbox.
 */
const TENANT_INBOXES = {
  "custom-showers": "sales@customshowers.uk",
};

/**
 * Rate limiting. Per-isolate and in memory: Cloudflare runs many isolates and
 * recycles them, so this is a burst brake rather than a hard quota. A WAF rate
 * limiting rule in front of the worker is the upgrade path if abuse gets real.
 */
/** Two drawings, up to five measurement photos, up to four of the room. */
const MAX_ATTACHMENTS = 12;
/** Well inside Resend's limit, and inside what an inbox will accept. */
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const hits = new Map();

/**
 * Fast completions are flagged, never dropped. Silently binning a real enquiry
 * is the worst outcome available: the customer sees "Design sent" and the
 * workshop never hears about it, so a lost job leaves no trace. A junk email
 * costs seconds to delete.
 */
const SUSPICIOUS_ELAPSED_MS = 10000;

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);
    
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    // A browser GET lands here. Return the version so opening the URL in a tab
    // confirms which paste is actually live — otherwise "did the deploy take?"
    // is only answerable by triggering a failure and reading the logs.
    if (request.method !== "POST") {
      return new Response(
        `customshowers-design ${WORKER_VERSION} — this endpoint only accepts POST from the configurator.`,
        { status: 405, headers: { "Content-Type": "text/plain", ...corsHeaders } }
      );
    }

    try {
      const body = await request.json();
      const { tenantId, customer, summary, spec, disclaimer, attachments, turnstileToken, antispam } =
        body || {};

      if (!customer?.name || !customer?.email) {
        return json({ error: "Name and email are required." }, 400, corsHeaders);
      }

      // The honeypot is the one signal certain enough to drop on: the field is
      // off-screen, aria-hidden and untabbable, so no person can reach it.
      // Returning success avoids telling a bot which check it tripped.
      if (antispam?.honeypot) {
        console.warn("Dropped: honeypot filled", { ip: clientIp(request), tenantId });
        return json({ success: true }, 200, corsHeaders);
      }

      if (rateLimited(`ip:${clientIp(request)}`, MAX_PER_IP)) {
        console.warn("Rate limited", { ip: clientIp(request), tenantId });
        return json(
          { error: "Too many designs sent from here just now. Please try again shortly." },
          429,
          corsHeaders
        );
      }

      // Verify Turnstile token when the secret key is configured. Unlike the
      // previous lenient approach, missing tokens are now rejected to prevent
      // spam while ensuring legitimate users can complete the security check.
      if (env.TURNSTILE_SECRET_KEY) {
        if (!turnstileToken) {
          console.warn("Rejected: no challenge token", { ip: clientIp(request), tenantId });
          return json(
            {
              error: "Security check required. Please allow challenges.cloudflare.com, disable ad blockers, and refresh the page.",
            },
            403,
            corsHeaders
          );
        }
        
        // Verify the token server-side
        const verifyRes = await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
          }
        );
        const verify = await verifyRes.json();
        if (!verify.success) {
          console.error("Turnstile verification failed", verify);
          // Cloudflare names the fault precisely; passing it through turns a
          // generic "security check failed" into an actionable one. The most
          // common by far is invalid-input-secret: the secret on this worker
          // belongs to a different widget than the site key on the page, and
          // the two only work as the pair Turnstile issued them in.
          const codes = verify["error-codes"] || [];
          const hint = codes.includes("invalid-input-secret")
            ? "The TURNSTILE_SECRET_KEY on this worker does not match the site key the page uses. They must be the pair from the same Turnstile widget."
            : codes.includes("invalid-input-response")
              ? "The challenge token was not accepted — usually the secret belongs to a different widget than the site key."
              : codes.includes("timeout-or-duplicate")
                ? "The challenge token had already been used or expired. Reload the page and try again."
                : "";
          return json(
            {
              error: `Security check failed. ${hint}`.trim(),
              detail: codes.join(", ") || null,
            },
            400,
            corsHeaders
          );
        }
      }

      const challengeSkipped = false;
      const tooFast =
        typeof antispam?.elapsedMs === "number" && antispam.elapsedMs < SUSPICIOUS_ELAPSED_MS;
      if (tooFast) {
        console.warn("Flagged: submitted quickly", { elapsedMs: antispam.elapsedMs, tenantId });
      }

      // Only speed suppresses the customer copy — a blocked challenge says
      // nothing about whether the address is real.
      const suspicious = tooFast || challengeSkipped;

      const businessEmail = TENANT_INBOXES[tenantId] || env.BUSINESS_EMAIL || "sales@customshowers.uk";
      const fromAddress = env.FROM_EMAIL || "Custom Showers <noreply@customshowers.uk>";

      // Drawings first, then up to four customer photos. The client sends them
      // in that order and this keeps it: if anything has to be dropped for
      // size it should be a photo, never the panel schedule.
      //
      // The cap is a total size rather than a count. Photos are downscaled in
      // the browser to roughly 200-400KB each, but a browser that could not
      // run the canvas step falls back to sending what it has, and an email
      // Resend refuses helps nobody.
      const mailAttachments = [];
      let attachmentBytes = 0;
      for (const a of (attachments || []).slice(0, MAX_ATTACHMENTS)) {
        if (!a || !a.content || !a.filename) continue;
        // base64 carries 3 bytes in every 4 characters.
        const bytes = Math.ceil((a.content.length * 3) / 4);
        if (attachmentBytes + bytes > MAX_ATTACHMENT_BYTES) {
          console.warn("Attachment skipped, over size budget", { filename: a.filename, bytes });
          continue;
        }
        attachmentBytes += bytes;
        mailAttachments.push({ filename: a.filename, content: a.content });
      }

      const specTable = buildSpecTable(spec?.panels || []);

      // To the workshop.
      await sendEmail(env, {
        from: fromAddress,
        to: [businessEmail],
        reply_to: customer.email,
        subject: `${suspicious ? "[Check] " : ""}Shower design from ${customer.name}${
          customer.postcode ? ` (${customer.postcode})` : ""
        }`,
        html: businessHtml({ customer, summary, spec, disclaimer, specTable, tooFast, challengeSkipped, antispam, mailAttachments }),
        attachments: mailAttachments,
      });

      // Copy to the customer, suppressed only on a suspiciously fast
      // completion — there the address may belong to someone who never filled
      // anything in, and mailing them would make us the one sending junk. A
      // merely unverified challenge is not that signal: it is almost always a
      // real person behind an ad blocker, and they are expecting this email.
      if (!tooFast) {
        await sendEmail(env, {
          from: fromAddress,
          to: [customer.email],
          subject: "Your shower design — Custom Showers",
          html: customerHtml({ customer, summary, disclaimer, specTable }),
          // Drawings only, which are the PNGs. Posting the customer's own
          // photos of their bathroom back to them adds megabytes and tells
          // them nothing.
          attachments: mailAttachments.filter((a) => a.filename.endsWith(".png")),
        });
      }

      return json({ success: true }, 200, corsHeaders);
    } catch (err) {
      console.error("design-worker error:", err);

      // Setup faults are the overwhelmingly likely cause of a failure here,
      // and "internal server error" sends whoever is debugging into the logs
      // for something the response could simply have told them.
      if (err instanceof MailError) {
        const hint =
          err.status === 401
            ? "The RESEND_API_KEY on this worker is missing or wrong."
            : err.status === 403
              ? "Resend refused the sender address — the domain in FROM_EMAIL is probably not verified."
              : err.status === 0
                ? "No RESEND_API_KEY is set on this worker."
                : "The email provider rejected the message.";
        return json({ error: `Could not send the email. ${hint}`, detail: err.detail }, 502, corsHeaders);
      }

      return json({ error: "Internal server error" }, 500, corsHeaders);
    }
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function clientIp(request) {
  return request.headers.get("cf-connecting-ip") || "unknown";
}

function rateLimited(key, max) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

/**
 * Thrown when the mail provider refuses the message, so the handler can report
 * something more useful than "internal server error".
 */
class MailError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function sendEmail(env, payload) {
  if (!env.RESEND_API_KEY) {
    throw new MailError("RESEND_API_KEY is not set on this worker", 0, null);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend rejected the message", res.status, detail);
    // 401 means the key is wrong or missing; 403 usually means the sending
    // domain is not verified in Resend. Both are setup problems worth naming.
    throw new MailError(`Resend returned ${res.status}`, res.status, detail.slice(0, 300));
  }
}

/** Escape everything that reaches the email body. All of it is user supplied. */
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TD = 'style="padding:8px 10px;border-bottom:1px solid #e2e8f0;"';
const TH =
  'style="padding:8px 10px;border-bottom:2px solid #cbd5e1;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#475569;"';

const SUMMARY_LABELS = {
  runWidthMm: "Overall run",
  heightMm: "Height",
  panelCount: "Panels",
  cornerCount: "Corners",
  mounting: "Fixing",
  finish: "Finish",
  handle: "Handle",
  glass: "Glass",
  glassType: "Glass type",
  glassCoating: "Coating",
  openingWidths: "Opening measured",
  openingCondition: "Walls and floor",
  measuredBy: "Checked with",
};

function summaryRows(summary) {
  return Object.entries(summary || {})
    .map(
      ([k, v]) =>
        `<tr><td ${TD} width="160"><strong>${esc(SUMMARY_LABELS[k] || k)}</strong></td><td ${TD}>${esc(v)}</td></tr>`
    )
    .join("");
}

function buildSpecTable(panels) {
  const rows = panels
    .map((p) => {
      const detail = [];
      if (p.door) {
        const count = p.door.hingeCount ? `${esc(p.door.hingeCount)} × ` : "";
        detail.push(
          `${count}${esc(p.door.hingeBrand)} hinges, ${esc(p.door.hingeSide)} hand`,
          `opens ${p.door.swing === "both" ? "both ways" : "outwards only"}`,
          esc(p.door.sealType)
        );
        if (p.door.hingeHeightsMm?.length) {
          detail.push(
            `hinge centres ${p.door.hingeHeightsMm.map(esc).join(" / ")}mm from the bottom`
          );
        }
      }
      for (const n of p.notches || []) {
        detail.push(`notch ${esc(n.corner)} ${esc(n.widthMm)}×${esc(n.heightMm)}mm`);
      }
      // Cutouts carry their own height, so they are listed rather than folded
      // into the run-on detail line — the workshop reads these one at a time.
      const cutouts = (p.cutouts || [])
        .map((c) => `<div>${esc(c.description)} — ${esc(c.heightMm)}mm, ${esc(c.edge)}</div>`)
        .join("");

      return `
        <tr>
          <td ${TD}><strong>${esc(p.label)}</strong>${
            detail.length
              ? `<div style="color:#64748b;font-size:12px;margin-top:4px;">${detail.join(" · ")}</div>`
              : ""
          }${
            cutouts
              ? `<div style="color:#64748b;font-size:12px;margin-top:4px;">${cutouts}</div>`
              : ""
          }</td>
          <td ${TD} align="right">${esc(p.tightWidthMm)} × ${esc(p.tightHeightMm)}</td>
          <td ${TD} align="right"><strong>${esc(p.cutWidthMm)} × ${esc(p.cutHeightMm)}</strong></td>
          <td ${TD} align="right">${esc(p.weightKg)}kg</td>
        </tr>`;
    })
    .join("");

  return `
    <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
      <thead>
        <tr>
          <th ${TH}>Panel</th>
          <th ${TH} align="right">Measured (mm)</th>
          <th ${TH} align="right">Cut size (mm)</th>
          <th ${TH} align="right">Weight</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function businessHtml({ customer, summary, spec, disclaimer, specTable, tooFast, challengeSkipped, antispam, mailAttachments }) {
  const warnings = spec?.warnings || [];
  const blockingIssues = spec?.blockingIssues || [];
  const rakeNotes = spec?.rakeNotes || [];

  return `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 4px;">New shower design</h2>
      <p style="margin:0 0 20px;color:#64748b;">Sent from the online configurator.</p>

      ${
        blockingIssues.length
          ? `<div style="margin:0 0 20px;padding:12px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#991b1b;font-size:13px;">
               <strong>Cannot be made as drawn.</strong> The customer was told this and sent it anyway,
               so they are expecting an alternative:
               <ul style="margin:8px 0 0;padding-left:18px;">
                 ${blockingIssues.map((w) => `<li>${esc(w)}</li>`).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        tooFast
          ? `<div style="margin:0 0 20px;padding:12px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#991b1b;font-size:13px;">
               <strong>Possibly automated.</strong> The whole design was completed in
               ${esc(Math.round((antispam?.elapsedMs || 0) / 1000))} seconds, faster than a person
               usually manages. Worth a glance before you reply.
             </div>`
          : ""
      }
      ${
        challengeSkipped
          ? `<div style="margin:0 0 20px;padding:12px 14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;color:#92400e;font-size:13px;">
               <strong>Security check did not run.</strong> The Turnstile widget failed to load for
               this visitor, usually an ad blocker. Most likely a real customer, but it was not
               verified.
             </div>`
          : ""
      }

      <h3 style="margin:24px 0 8px;">Customer</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td ${TD} width="160"><strong>Name</strong></td><td ${TD}>${esc(customer.name)}</td></tr>
        <tr><td ${TD}><strong>Email</strong></td><td ${TD}><a href="mailto:${esc(customer.email)}">${esc(customer.email)}</a></td></tr>
        <tr><td ${TD}><strong>Phone</strong></td><td ${TD}>${esc(customer.phone)}</td></tr>
        <tr><td ${TD}><strong>Postcode</strong></td><td ${TD}>${esc(customer.postcode)}</td></tr>
      </table>

      <h3 style="margin:24px 0 8px;">Configuration</h3>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${summaryRows(summary)}
        <tr><td ${TD}><strong>Channel required</strong></td><td ${TD}>${esc(spec?.totalChannelLengthMm)}mm</td></tr>
        <tr><td ${TD}><strong>Total weight</strong></td><td ${TD}>${esc(spec?.totalGlassWeightKg)}kg</td></tr>
      </table>

      <h3 style="margin:24px 0 8px;">Panel schedule</h3>
      ${specTable}

      ${
        rakeNotes.length
          ? `<h3 style="margin:24px 0 8px;">Out of square</h3><ul style="font-size:14px;color:#334155;">${rakeNotes
              .map((n) => `<li>${esc(n)}</li>`)
              .join("")}</ul>`
          : ""
      }

      ${
        warnings.length
          ? `<div style="margin:24px 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;">
               <strong style="color:#92400e;">Check before cutting</strong>
               <ul style="margin:8px 0 0;padding-left:18px;color:#92400e;font-size:14px;">
                 ${warnings.map((w) => `<li>${esc(w)}</li>`).join("")}
               </ul>
             </div>`
          : ""
      }

      ${
        customer.notes
          ? `<h3 style="margin:24px 0 8px;">Customer notes</h3><p style="font-size:14px;white-space:pre-wrap;">${esc(customer.notes)}</p>`
          : ""
      }

      <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
        ${esc(disclaimer)}
      </p>
      ${
        mailAttachments.length
          ? (() => {
              const drawings = mailAttachments.filter((a) => a.filename.endsWith(".png"));
              const shots = mailAttachments.filter((a) => !a.filename.endsWith(".png"));
              return `<p style="color:#64748b;font-size:12px;">Drawings: ${
                drawings.map((a) => esc(a.filename)).join(", ") || "none"
              }.${
                shots.length
                  ? ` Customer photos: ${shots
                      .map((a) => esc(a.filename))
                      .join(
                        ", "
                      )} — the <strong>measured-</strong> ones were taken at the wall and show the tape in place for that measurement, so they can be checked against the figures above.`
                  : ""
              }</p>`;
            })()
          : `<p style="color:#b45309;font-size:12px;">No drawings were attached — work from the panel schedule above.</p>`
      }
    </div>`;
}

function customerHtml({ customer, summary, disclaimer, specTable }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
      <h2>Thanks, ${esc(String(customer.name).split(" ")[0])}</h2>
      <p style="font-size:14px;">
        We have your design and will be in touch to confirm the sizes. Here is what you sent us:
      </p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${summaryRows(summary)}
      </table>
      ${specTable}
      <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
        ${esc(disclaimer)}
      </p>
      <p style="font-size:14px;">Questions? Just reply to this email.</p>
    </div>`;
}

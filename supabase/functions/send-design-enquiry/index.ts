import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

/**
 * Receives a completed design from the configurator and emails it to the
 * glazier, with the plan and elevation drawings attached as PNGs.
 *
 * There is no pricing anywhere in this flow — the glazier quotes from the
 * measurements themselves.
 */

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
const fallbackBusinessEmail = Deno.env.get("BUSINESS_EMAIL") ?? "sales@customshowers.uk";
const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Custom Showers <noreply@customshowers.uk>";

/**
 * Destination addresses are allow-listed per tenant rather than taken from the
 * request. The endpoint is public and embedded on third-party sites, so an
 * attacker who can post to it must not be able to point our mail relay at an
 * arbitrary inbox.
 */
const TENANT_INBOXES: Record<string, string> = {
  "custom-showers": fallbackBusinessEmail,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Rate limiting.
 *
 * This is per-isolate and in-memory: Deno Deploy runs several isolates and
 * recycles them, so a determined attacker spreading requests around will get
 * more through than the numbers below suggest. It is a burst brake, not a hard
 * quota. Moving it to a shared store (or a Cloudflare WAF rule in front of the
 * function) is the upgrade path if abuse ever becomes real.
 */
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_IP = 5;
const MAX_PER_TENANT = 60;

const hits = new Map<string, number[]>();

function rateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound across a long-lived isolate.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

/**
 * Shortest plausible time to design an enclosure and fill in the form.
 *
 * This flags, it does not drop. Silently binning a real enquiry is the worst
 * outcome available here — the customer is told "Design sent" and the glazier
 * never sees it, so a lost job leaves no trace anywhere. A junk email costs a
 * few seconds to delete. The asymmetry only points one way.
 */
const SUSPICIOUS_ELAPSED_MS = 10000;

interface PanelSpecPayload {
  label?: string;
  kind?: string;
  tightWidthMm?: number;
  tightHeightMm?: number;
  cutWidthMm?: number;
  cutHeightMm?: number;
  weightKg?: number;
  notches?: { corner?: string; widthMm?: number; heightMm?: number }[];
  door?: {
    hingeSide?: string;
    swing?: string;
    sealType?: string;
    hingeBrand?: string;
    hingePlacement?: { bottomHingeOffset?: number; topHingeOffset?: number };
  };
}

interface EnquiryRequest {
  tenantId?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    postcode?: string;
    notes?: string;
  };
  summary?: Record<string, string | number>;
  spec?: {
    panels?: PanelSpecPayload[];
    totalRunWidthMm?: number;
    totalChannelLengthMm?: number;
    totalGlassWeightKg?: number;
    cornerCount?: number;
    heightMm?: number;
    isFloorToCeiling?: boolean;
    glassThicknessMm?: number;
    rakeNotes?: string[];
    warnings?: string[];
  };
  disclaimer?: string;
  attachments?: { filename?: string; content?: string }[];
  turnstileToken?: string;
  antispam?: { honeypot?: string; elapsedMs?: number };
}

/** Escape anything that reaches the email body. All of it is user-supplied. */
function esc(value: unknown): string {
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

function panelRows(panels: PanelSpecPayload[]): string {
  return panels
    .map((p) => {
      const detail: string[] = [];
      if (p.door) {
        detail.push(
          `${esc(p.door.hingeBrand)} hinges, ${esc(p.door.hingeSide)} hand`,
          `opens ${p.door.swing === "both" ? "both ways" : "outwards only"}`,
          `${esc(p.door.sealType)}`
        );
        if (p.door.hingePlacement?.bottomHingeOffset) {
          detail.push(`hinges ${esc(p.door.hingePlacement.bottomHingeOffset)}mm from each edge`);
        }
      }
      for (const n of p.notches ?? []) {
        detail.push(`notch ${esc(n.corner)} ${esc(n.widthMm)}×${esc(n.heightMm)}mm`);
      }

      return `
        <tr>
          <td ${TD}><strong>${esc(p.label)}</strong>${
            detail.length
              ? `<div style="color:#64748b;font-size:12px;margin-top:4px;">${detail.join(" · ")}</div>`
              : ""
          }</td>
          <td ${TD} align="right" style="padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">${esc(
            p.tightWidthMm
          )} × ${esc(p.tightHeightMm)}</td>
          <td ${TD} align="right" style="padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;font-weight:bold;">${esc(
            p.cutWidthMm
          )} × ${esc(p.cutHeightMm)}</td>
          <td ${TD} align="right" style="padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">${esc(
            p.weightKg
          )}kg</td>
        </tr>`;
    })
    .join("");
}

function summaryRows(summary: Record<string, string | number>): string {
  const labels: Record<string, string> = {
    runWidthMm: "Overall run",
    heightMm: "Height",
    panelCount: "Panels",
    cornerCount: "Corners",
    mounting: "Fixing",
    finish: "Finish",
    handle: "Handle",
    glass: "Glass",
  };
  return Object.entries(summary)
    .map(
      ([k, v]) =>
        `<tr><td ${TD} width="160"><strong>${esc(labels[k] ?? k)}</strong></td><td ${TD}>${esc(
          v
        )}</td></tr>`
    )
    .join("");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EnquiryRequest = await req.json();
    const { customer, summary, spec, disclaimer, attachments, turnstileToken, tenantId, antispam } =
      body;

    if (!customer?.name || !customer?.email) {
      return new Response(
        JSON.stringify({ success: false, error: "Name and email are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // The honeypot is the one signal certain enough to drop on: the field is
    // off-screen, aria-hidden and untabbable, so no person can reach it.
    // Returning success avoids telling a bot which check it tripped.
    if (antispam?.honeypot) {
      console.warn("Dropped: honeypot filled", { ip: clientIp(req), tenantId });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Speed only raises an eyebrow. The enquiry still goes through, marked, so
    // the glazier decides.
    const tooFast =
      typeof antispam?.elapsedMs === "number" && antispam.elapsedMs < SUSPICIOUS_ELAPSED_MS;
    if (tooFast) {
      console.warn("Flagged: submitted quickly", {
        elapsedMs: antispam?.elapsedMs,
        ip: clientIp(req),
        tenantId,
      });
    }

    // Rate limits do get a real error, since a legitimate customer could hit
    // them by resubmitting and deserves to know why nothing happened.
    const ip = clientIp(req);
    if (rateLimited(`ip:${ip}`, MAX_PER_IP) || rateLimited(`tenant:${tenantId}`, MAX_PER_TENANT)) {
      console.warn("Rate limited", { ip, tenantId });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Too many designs sent from here just now. Please try again shortly.",
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Turnstile is skipped only when no secret is configured, so a local dev
    // environment works without one but production always verifies.
    if (turnstileSecret) {
      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${turnstileSecret}&response=${turnstileToken ?? ""}`,
        }
      );
      const verify = await verifyRes.json();
      if (!verify.success) {
        console.error("Turnstile verification failed", verify);
        return new Response(
          JSON.stringify({ success: false, error: "Security check failed. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const businessEmail = TENANT_INBOXES[tenantId ?? ""] ?? fallbackBusinessEmail;

    const mailAttachments = (attachments ?? [])
      .filter((a) => a?.content && a?.filename)
      .slice(0, 4)
      .map((a) => ({ filename: a.filename!, content: a.content!, type: "image/png" }));

    const panels = spec?.panels ?? [];
    const warnings = spec?.warnings ?? [];
    const rakeNotes = spec?.rakeNotes ?? [];

    const specTable = `
      <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px;">
        <thead>
          <tr>
            <th ${TH}>Panel</th>
            <th ${TH} align="right">Measured</th>
            <th ${TH} align="right">Cut size</th>
            <th ${TH} align="right">Weight</th>
          </tr>
        </thead>
        <tbody>${panelRows(panels)}</tbody>
      </table>`;

    await resend.emails.send({
      from: fromAddress,
      replyTo: customer.email,
      to: [businessEmail],
      subject: `${tooFast ? "[Possible spam] " : ""}Shower design from ${customer.name}${
        customer.postcode ? ` (${customer.postcode})` : ""
      }`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
          <h2 style="margin:0 0 4px;">New shower design</h2>
          <p style="margin:0 0 20px;color:#64748b;">Sent from the online configurator.</p>

          ${
            tooFast
              ? `<div style="margin:0 0 20px;padding:12px 14px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;color:#991b1b;font-size:13px;">
                   <strong>Possibly automated.</strong> The whole design was completed in
                   ${esc(Math.round((antispam?.elapsedMs ?? 0) / 1000))} seconds, which is faster
                   than a person usually manages. Worth a glance before you reply.
                 </div>`
              : ""
          }

          <h3 style="margin:24px 0 8px;">Customer</h3>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr><td ${TD} width="160"><strong>Name</strong></td><td ${TD}>${esc(customer.name)}</td></tr>
            <tr><td ${TD}><strong>Email</strong></td><td ${TD}><a href="mailto:${esc(
              customer.email
            )}">${esc(customer.email)}</a></td></tr>
            <tr><td ${TD}><strong>Phone</strong></td><td ${TD}>${esc(customer.phone)}</td></tr>
            <tr><td ${TD}><strong>Postcode</strong></td><td ${TD}>${esc(customer.postcode)}</td></tr>
          </table>

          <h3 style="margin:24px 0 8px;">Configuration</h3>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            ${summaryRows(summary ?? {})}
            <tr><td ${TD}><strong>Channel required</strong></td><td ${TD}>${esc(
              spec?.totalChannelLengthMm
            )}mm</td></tr>
            <tr><td ${TD}><strong>Total weight</strong></td><td ${TD}>${esc(
              spec?.totalGlassWeightKg
            )}kg</td></tr>
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
              ? `<h3 style="margin:24px 0 8px;">Customer notes</h3><p style="font-size:14px;white-space:pre-wrap;">${esc(
                  customer.notes
                )}</p>`
              : ""
          }

          <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
            ${esc(disclaimer)}
          </p>
          ${
            mailAttachments.length
              ? `<p style="color:#64748b;font-size:12px;">Drawings attached: ${mailAttachments
                  .map((a) => esc(a.filename))
                  .join(", ")}.</p>`
              : `<p style="color:#b45309;font-size:12px;">No drawings were attached — work from the panel schedule above.</p>`
          }
        </div>`,
      ...(mailAttachments.length > 0 ? { attachments: mailAttachments } : {}),
    });

    // Copy to the customer so they have a record of what they sent. Skipped
    // when the submission looks automated: the address may well belong to
    // someone who never filled anything in, and mailing them would make us the
    // one sending the junk.
    if (!tooFast) {
      await resend.emails.send({
        from: fromAddress,
        to: [customer.email],
        subject: "Your shower design — Custom Showers",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
            <h2>Thanks, ${esc(customer.name.split(" ")[0])}</h2>
            <p style="font-size:14px;">
              We have your design and will be in touch to confirm the sizes. Here is what you sent us:
            </p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;">
              ${summaryRows(summary ?? {})}
            </table>
            ${specTable}
            <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;">
              ${esc(disclaimer)}
            </p>
            <p style="font-size:14px;">Questions? Just reply to this email.</p>
          </div>`,
        ...(mailAttachments.length > 0 ? { attachments: mailAttachments } : {}),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-design-enquiry:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

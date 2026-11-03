/**
 * Quote form — enquiry handler.
 *
 * The site's "Get a free quote" form posts here. The worker verifies the
 * Turnstile token, keeps the enquiry for the admin dashboard, records the
 * Google Ads conversion, and emails the workshop and the customer.
 *
 * This file replaces the customshowers-contact worker that was deployed from
 * outside this repository. That version only counted an enquiry as received
 * once a Supabase insert succeeded, so a paused Supabase project made the
 * whole form fail with "Something went wrong". Here the dashboard's own
 * database (D1) is the record, Supabase is optional and never fatal, and the
 * customer's photo or sketch is attached to the email rather than dropped.
 *
 * Deployed by pasting this file into the dashboard, like the design worker.
 *
 * Secrets (Workers & Pages → customshowers-contact → Settings → Variables):
 *   RESEND_API_KEY        required to email; the enquiry is still kept without it
 *   TURNSTILE_SECRET_KEY  required in production; skipped if unset
 *   ALLOWED_ORIGIN        optional, defaults to https://customshowers.uk
 *   BUSINESS_EMAIL        optional, defaults to sales@customshowers.uk
 *   FROM_EMAIL            optional, defaults to Custom Showers Website <noreply@customshowers.uk>
 *   SUPABASE_URL          optional, with SUPABASE_SERVICE_KEY: also copies the contact to Supabase
 *   SUPABASE_SERVICE_KEY  optional
 *
 * Bindings (Settings → Bindings):
 *   JOBS       D1 database  "customshowers"       — the quotes table
 *   FILES      R2 bucket    "customshowers-files" — the photo, or
 *   FILES_KV   KV namespace "customshowers-files" — the same, where R2 is off
 */

const WORKER_VERSION = "v2";

const GOOGLE_ADS_CONVERSION_ID = "18009060377";
const GOOGLE_ADS_CONVERSION_LABEL = "XXJmCLrcKJAcEJnosYtD";

const ALLOWED_ORIGINS = [
  "https://customshowers.uk",
  "https://www.customshowers.uk",
  /^https:\/\/[a-z0-9-]+\.customshowers-website\.pages\.dev$/,
];

/** 5MB, matching the limit the form enforces before uploading. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed =
    ALLOWED_ORIGINS.some((a) => (a instanceof RegExp ? a.test(origin) : a === origin)) ||
    (env.ALLOWED_ORIGIN && env.ALLOWED_ORIGIN === origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : env.ALLOWED_ORIGIN || "https://customshowers.uk",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A readable quote number, Q-YYYYMMDD-XXXX, as the dashboard shows it. */
export function newQuoteId(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let tail = "";
  for (const b of bytes) tail += alphabet[b % alphabet.length];
  return `Q-${day}-${tail}`;
}

/** The fields the form sends, tidied, with the ad attribution it may carry. */
export function readEnquiry(body) {
  const b = body && typeof body === "object" ? body : {};
  const text = (v) => (typeof v === "string" ? v.trim() : "");
  const photo =
    b.photo && typeof b.photo === "object" && typeof b.photo.data === "string" && b.photo.data
      ? {
          name: text(b.photo.name) || "photo",
          type: text(b.photo.type) || "application/octet-stream",
          data: b.photo.data,
        }
      : null;
  if (photo && Math.ceil((photo.data.length * 3) / 4) > MAX_PHOTO_BYTES) {
    photo.tooBig = true;
  }
  return {
    name: text(b.name),
    email: text(b.email),
    phone: text(b.phone),
    address: text(b.address),
    serviceType: text(b.service_type || b.serviceType),
    message: text(b.message),
    turnstileToken: text(b.turnstileToken),
    utm: {
      source: text(b.utm_source) || null,
      medium: text(b.utm_medium) || null,
      campaign: text(b.utm_campaign) || null,
      term: text(b.utm_term) || null,
      content: text(b.utm_content) || null,
      gclid: text(b.gclid) || null,
    },
    photo,
  };
}

function fileStore(env) {
  if (env.FILES) {
    return { kind: "r2", put: (key, bytes, type) => env.FILES.put(key, bytes, { httpMetadata: { contentType: type } }) };
  }
  if (env.FILES_KV) {
    return { kind: "kv", put: (key, bytes, type) => env.FILES_KV.put(key, bytes, { metadata: { contentType: type } }) };
  }
  return null;
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Keep the enquiry for the dashboard. Never throws. */
export async function persistQuote(env, q, { emailed, supabaseOk }) {
  if (!env.JOBS) return null;
  const id = newQuoteId();
  const now = new Date().toISOString();
  try {
    let photoRecord = null;
    const store = fileStore(env);
    if (q.photo && !q.photo.tooBig && store) {
      const safeName = q.photo.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || "photo";
      const key = `quotes/${id}/${safeName}`;
      const bytes = base64ToBytes(q.photo.data);
      await store.put(key, bytes, q.photo.type);
      photoRecord = { filename: safeName, key, bytes: bytes.length, type: q.photo.type };
    }
    await env.JOBS.prepare(
      `INSERT INTO quotes (id, created_at, name, email, phone, address, service_type, message, photo_json, utm_json, status, emailed, supabase_ok)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'new', ?11, ?12)`
    )
      .bind(
        id,
        now,
        q.name || null,
        q.email || null,
        q.phone || null,
        q.address || null,
        q.serviceType || null,
        q.message || null,
        photoRecord ? JSON.stringify(photoRecord) : null,
        JSON.stringify(q.utm),
        emailed ? 1 : 0,
        supabaseOk ? 1 : 0
      )
      .run();
    return id;
  } catch (err) {
    console.error("Could not keep the quote for the dashboard", String(err));
    return null;
  }
}

async function verifyTurnstile(token, secret) {
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });
  const data = await res.json().catch(() => ({ success: false }));
  return !!data.success;
}

/** The old CRM copy, kept while it is wanted. Never fatal. */
async function copyToSupabase(env, q) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return false;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/contacts`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        name: q.name,
        email: q.email,
        phone: q.phone || null,
        address: q.address || null,
        source: "website",
        service_type: q.serviceType || null,
        message: q.message || null,
        utm_source: q.utm.source,
        utm_medium: q.utm.medium,
        utm_campaign: q.utm.campaign,
        utm_term: q.utm.term,
        utm_content: q.utm.content,
        gclid: q.utm.gclid,
      }),
    });
    if (!res.ok) console.error("Supabase copy failed", res.status, await res.text().catch(() => ""));
    return res.ok;
  } catch (err) {
    console.error("Supabase copy failed", String(err));
    return false;
  }
}

async function recordConversion(q) {
  try {
    const params = new URLSearchParams({
      value: "0",
      currency_code: "GBP",
      label: GOOGLE_ADS_CONVERSION_LABEL,
      script: "0",
      oid: q.email,
    });
    if (q.utm.gclid) params.set("gclid", q.utm.gclid);
    await fetch(`https://www.googleadservices.com/pagead/conversion/${GOOGLE_ADS_CONVERSION_ID}/?${params}`);
  } catch (err) {
    console.error("Google Ads conversion ping failed", String(err));
  }
}

function businessHtml(q, id) {
  const ads = Object.entries(q.utm).filter(([, v]) => v);
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 4px;">New quote enquiry</h2>
      <p style="margin:0 0 16px;color:#64748b;">From the website form.${id ? ` Job ${esc(id)} in the dashboard.` : ""}</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        <tr><td style="padding:6px 8px;"><strong>Name</strong></td><td style="padding:6px 8px;">${esc(q.name)}</td></tr>
        <tr><td style="padding:6px 8px;"><strong>Email</strong></td><td style="padding:6px 8px;"><a href="mailto:${esc(q.email)}">${esc(q.email)}</a></td></tr>
        <tr><td style="padding:6px 8px;"><strong>Phone</strong></td><td style="padding:6px 8px;">${esc(q.phone) || "—"}</td></tr>
        <tr><td style="padding:6px 8px;"><strong>Address</strong></td><td style="padding:6px 8px;">${esc(q.address) || "—"}</td></tr>
        <tr><td style="padding:6px 8px;"><strong>Location</strong></td><td style="padding:6px 8px;">${esc(q.serviceType) || "—"}</td></tr>
      </table>
      ${q.message ? `<h3 style="margin:20px 0 6px;">About the project</h3><p style="font-size:14px;white-space:pre-wrap;">${esc(q.message)}</p>` : ""}
      ${q.photo ? `<p style="font-size:13px;color:#64748b;">${q.photo.tooBig ? "A photo was sent but was over 5MB and was not kept." : `Photo attached: ${esc(q.photo.name)}`}</p>` : ""}
      ${
        ads.length
          ? `<h3 style="margin:20px 0 6px;">Ad attribution</h3><table style="border-collapse:collapse;font-size:13px;">${ads
              .map(([k, v]) => `<tr><td style="padding:4px 8px;"><strong>${esc(k)}</strong></td><td style="padding:4px 8px;">${esc(v)}</td></tr>`)
              .join("")}</table>`
          : ""
      }
    </div>`;
}

function customerHtml(q, businessEmail) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
      <div style="background:#1e293b;color:white;padding:30px;text-align:center;">
        <h1 style="margin:0;font-size:24px;">Thanks for your enquiry, ${esc(q.name.split(" ")[0] || q.name)}</h1>
      </div>
      <div style="padding:30px;">
        <p>We have your quote request and will get back to you within <strong>one business day</strong>.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <tr style="background:#f8fafc;"><td style="padding:8px;font-weight:bold;width:140px;">Location</td><td style="padding:8px;">${esc(q.serviceType) || "—"}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Address</td><td style="padding:8px;">${esc(q.address) || "—"}</td></tr>
        </table>
        ${q.message ? `<p style="margin-top:16px;white-space:pre-wrap;">${esc(q.message)}</p>` : ""}
        <p style="margin-top:24px;">Need us sooner? <a href="mailto:${esc(businessEmail)}" style="color:#1e293b;">${esc(businessEmail)}</a></p>
        <p style="margin-top:30px;">The Custom Showers team</p>
      </div>
    </div>`;
}

async function sendEmail(env, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Resend rejected the message", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") {
      return new Response(
        `customshowers-contact ${WORKER_VERSION} — this endpoint only accepts POST from the quote form.`,
        { status: 405, headers: { "Content-Type": "text/plain", ...cors } }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: "Invalid JSON" }, 400, cors);
    }
    const q = readEnquiry(body);
    if (!q.name || !q.email) {
      return json({ success: false, error: "Name and email are required." }, 400, cors);
    }

    if (env.TURNSTILE_SECRET_KEY) {
      if (!q.turnstileToken) {
        return json({ success: false, error: "Security check required. Please try again." }, 403, cors);
      }
      let ok = false;
      try {
        ok = await verifyTurnstile(q.turnstileToken, env.TURNSTILE_SECRET_KEY);
      } catch (err) {
        console.error("Turnstile verification failed", String(err));
      }
      if (!ok) return json({ success: false, error: "Security check failed. Please try again." }, 403, cors);
    }

    const supabaseOk = await copyToSupabase(env, q);
    await recordConversion(q);

    const businessEmail = env.BUSINESS_EMAIL || "sales@customshowers.uk";
    const fromEmail = env.FROM_EMAIL || "Custom Showers Website <noreply@customshowers.uk>";

    // The dashboard copy first, so the email can carry the job number.
    const quoteId = await persistQuote(env, q, { emailed: false, supabaseOk });

    let emailed = false;
    if (env.RESEND_API_KEY) {
      const attachments =
        q.photo && !q.photo.tooBig ? [{ filename: q.photo.name, content: q.photo.data }] : [];
      emailed = await sendEmail(env, {
        from: fromEmail,
        to: [businessEmail],
        reply_to: q.email,
        subject: `New enquiry from ${q.name}${quoteId ? ` (${quoteId})` : ""}`,
        html: businessHtml(q, quoteId),
        ...(attachments.length ? { attachments } : {}),
      });
      await sendEmail(env, {
        from: fromEmail,
        to: [q.email],
        subject: "We've received your quote request — Custom Showers",
        html: customerHtml(q, businessEmail),
      });
      if (emailed && quoteId && env.JOBS) {
        try {
          await env.JOBS.prepare(`UPDATE quotes SET emailed = 1 WHERE id = ?1`).bind(quoteId).run();
        } catch (err) {
          console.error("Could not mark the quote as emailed", String(err));
        }
      }
    } else {
      console.error("No RESEND_API_KEY on this worker; the enquiry was kept but not emailed");
    }

    // Received means kept or emailed. Only when neither happened is it lost,
    // and then the customer should know to try again.
    if (!quoteId && !emailed) {
      return json({ success: false, error: "Something went wrong, please try again." }, 500, cors);
    }
    return json({ success: true, quoteId, message: "Thank you, we'll be in touch shortly." }, 200, cors);
  },
};

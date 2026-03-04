/**
 * Custom Showers - Cloudflare Worker
 *
 * Handles contact form submissions:
 *  1. Verifies reCAPTCHA
 *  2. Creates / updates a HubSpot contact
 *  3. Creates a HubSpot deal linked to that contact
 *  4. Sends an email notification via Cloudflare Email Routing
 *
 * Required environment variables (set in Cloudflare dashboard → Workers → Settings → Variables):
 *   HUBSPOT_API_TOKEN      — HubSpot Private App token
 *   TURNSTILE_SECRET_KEY   — Cloudflare Turnstile secret key
 *
 * Required binding (set in wrangler.toml or dashboard):
 *   SEND_EMAIL — Cloudflare send_email binding
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { name, email, phone, address, message, turnstileToken } =
        await request.json();

      // ── 1. Verify Turnstile ──────────────────────────────────────────────
      const captchaRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
        }
      );
      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        return json({ error: "Security check failed" }, 400);
      }

      // ── 2. Create / find HubSpot contact ────────────────────────────────
      const [firstName, ...rest] = name.trim().split(" ");
      const lastName = rest.join(" ");

      let contactId = null;

      const createContactRes = await hubspot("POST", "contacts", env, {
        properties: { firstname: firstName, lastname: lastName, email, phone, address },
      });

      if (createContactRes.ok) {
        const data = await createContactRes.json();
        contactId = data.id;
      } else if (createContactRes.status === 409) {
        // Contact already exists — look it up by email
        const existingRes = await hubspot(
          "GET",
          `contacts/${encodeURIComponent(email)}?idProperty=email`,
          env
        );
        if (existingRes.ok) {
          const data = await existingRes.json();
          contactId = data.id;
        }
      }

      // ── 3. Create HubSpot deal ───────────────────────────────────────────
      const createDealRes = await hubspot("POST", "deals", env, {
        properties: {
          dealname: `Custom Shower Enquiry – ${name}`,
          pipeline: "default",
          dealstage: "appointmentscheduled",
          description: message,
        },
      });

      let dealId = null;
      if (createDealRes.ok) {
        const data = await createDealRes.json();
        dealId = data.id;
      }

      // ── 4. Associate deal ↔ contact ──────────────────────────────────────
      if (dealId && contactId) {
        await fetch(
          `https://api.hubapi.com/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${env.HUBSPOT_API_TOKEN}` },
          }
        );
      }

      // ── 5. Send email notification via Cloudflare Email Routing ─────────
      const hubspotLink = dealId
        ? `<p><a href="https://app.hubspot.com/deals/${dealId}">View deal in HubSpot →</a></p>`
        : "";

      const htmlBody = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Message:</strong></p>
        <p>${message ? message.replace(/\n/g, "<br>") : "—"}</p>
        ${hubspotLink}
      `.trim();

      const rawEmail = [
        `From: Custom Showers Website <noreply@customshowers.uk>`,
        `To: sales@customshowers.uk`,
        `Subject: New Enquiry from ${name}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody,
      ].join("\r\n");

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      writer.write(new TextEncoder().encode(rawEmail));
      writer.close();

      const emailMessage = new EmailMessage(
        "noreply@customshowers.uk",
        "sales@customshowers.uk",
        readable
      );
      await env.SEND_EMAIL.send(emailMessage);

      return json({ success: true });
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal server error" }, 500);
    }
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function hubspot(method, path, env, body) {
  return fetch(`https://api.hubapi.com/crm/v3/objects/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBSPOT_API_TOKEN}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

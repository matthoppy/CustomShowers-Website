var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.ts
var GOOGLE_ADS_CONVERSION_ID = "18009060377";
var GOOGLE_ADS_CONVERSION_LABEL = "XXJmCLrcKJAcEJnosYtD";
var corsHeaders = /* @__PURE__ */ __name((origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}), "corsHeaders");
var customshowers_contact_default = {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://customshowers.uk";
    const cors = corsHeaders(allowedOrigin);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
    const { name, email, phone, address, message } = body;
    const service_type = body.service_type || body.serviceType || null;
    const utm_source = body.utm_source || null;
    const utm_medium = body.utm_medium || null;
    const utm_campaign = body.utm_campaign || null;
    const utm_term = body.utm_term || null;
    const utm_content = body.utm_content || null;
    const gclid = body.gclid || null;
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "name and email are required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" }
      });
    }
    if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
      try {
        const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET_KEY,
            response: body.turnstileToken
          })
        });
        const tsData = await tsRes.json();
        if (!tsData.success) {
          return new Response(JSON.stringify({ error: "Security check failed" }), {
            status: 403,
            headers: { ...cors, "Content-Type": "application/json" }
          });
        }
      } catch {
        console.warn("Turnstile verification skipped due to error");
      }
    }
    let supabaseOk = false;
    try {
      const supabaseRes = await fetch(
        `${env.SUPABASE_URL}/rest/v1/contacts`,
        {
          method: "POST",
          headers: {
            apikey: env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            name,
            email,
            phone: phone || null,
            address: address || null,
            source: "website",
            service_type: service_type || null,
            message: message || null,
            utm_source: utm_source || null,
            utm_medium: utm_medium || null,
            utm_campaign: utm_campaign || null,
            utm_term: utm_term || null,
            utm_content: utm_content || null,
            gclid: gclid || null
          })
        }
      );
      if (!supabaseRes.ok) {
        console.error("Supabase error:", await supabaseRes.text());
      } else {
        supabaseOk = true;
      }
    } catch (err) {
      console.error("Supabase exception:", String(err));
    }
    // Fire Google Ads server-side conversion ping only on successful lead save
    if (supabaseOk) {
      try {
        const params = new URLSearchParams({
          cv: "1",
          currency_code: "GBP",
          label: GOOGLE_ADS_CONVERSION_LABEL,
          script: "0",
          guid: "ON"
        });
        if (gclid) params.set("gclid", gclid);
        await fetch(
          `https://www.googleadservices.com/pagead/conversion/${GOOGLE_ADS_CONVERSION_ID}/?${params.toString()}`,
          { method: "GET" }
        );
        console.log("Google Ads conversion ping sent", gclid ? "with gclid" : "without gclid");
      } catch (err) {
        console.error("Google Ads conversion ping failed:", String(err));
      }
    }
    if (env.RESEND_API_KEY) {
      try {
        const adsSection = utm_source || gclid ? `
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
          <p style="color:#1a2942;font-weight:600">Ad Attribution</p>
          ${utm_source ? `<p><strong>UTM Source:</strong> ${utm_source}</p>` : ""}
          ${utm_medium ? `<p><strong>UTM Medium:</strong> ${utm_medium}</p>` : ""}
          ${utm_campaign ? `<p><strong>UTM Campaign:</strong> ${utm_campaign}</p>` : ""}
          ${utm_term ? `<p><strong>UTM Term:</strong> ${utm_term}</p>` : ""}
          ${utm_content ? `<p><strong>UTM Content:</strong> ${utm_content}</p>` : ""}
          ${gclid ? `<p><strong>Google Click ID:</strong> ${gclid}</p>` : ""}
        ` : "";
        const htmlBody = `
          <h2>New Website Enquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone || "\u2014"}</p>
          <p><strong>Address:</strong> ${address || "\u2014"}</p>
          <p><strong>Service Type:</strong> ${service_type || "\u2014"}</p>
          <p><strong>Message:</strong></p>
          <p>${message ? message.replace(/\n/g, "<br>") : "\u2014"}</p>
          ${adsSection}
          <p style="color:#64748b;font-size:12px">\u2705 Also saved to CRM portal contacts.</p>
        `;
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Custom Showers Website <noreply@customshowers.uk>",
            to: ["sales@customshowers.uk"],
            subject: `New Enquiry from ${name}`,
            html: htmlBody
          })
        });
        if (!resendRes.ok) {
          console.error("Resend error:", await resendRes.text());
        }
      } catch (err) {
        console.error("Resend exception:", String(err));
      }
    }
    if (!supabaseOk) {
      return new Response(
        JSON.stringify({ success: false, message: "Something went wrong, please try again." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ success: true, message: "Thank you, we'll be in touch shortly." }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
};
export {
  customshowers_contact_default as default
};

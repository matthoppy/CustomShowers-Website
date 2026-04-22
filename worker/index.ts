export interface Env {
  RESEND_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  BUSINESS_EMAIL: string;
  FROM_EMAIL: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json() as {
        name: string;
        email: string;
        phone: string;
        address: string;
        serviceType: string;
        message: string;
        turnstileToken: string;
        photo?: { name: string; type: string; data: string } | null;
      };

      const { name, email, phone, address, serviceType, message, turnstileToken, photo } = body;

      // Verify Turnstile token
      const tsRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
      });
      const tsResult = await tsRes.json() as { success: boolean };

      if (!tsResult.success) {
        return new Response(
          JSON.stringify({ success: false, error: "Security check failed. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const businessEmail = env.BUSINESS_EMAIL || "sales@customshowers.uk";
      const fromEmail = env.FROM_EMAIL || "Custom Showers <noreply@customshowers.uk>";

      // Build attachments
      const attachments = photo?.data
        ? [{ filename: photo.name, content: photo.data, type: photo.type }]
        : [];

      // Notification to business
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [businessEmail],
          subject: `New Quote Enquiry from ${name}`,
          html: `
            <h2 style="color:#1e40af;">New Quote Enquiry</h2>
            <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;">
              <tr><td style="padding:8px;font-weight:bold;width:140px;">Name</td><td style="padding:8px;">${name}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Email</td><td style="padding:8px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Phone</td><td style="padding:8px;">${phone}</td></tr>
              <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;">Address</td><td style="padding:8px;">${address}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Service</td><td style="padding:8px;">${serviceType}</td></tr>
            </table>
            ${message ? `<h3 style="color:#1e40af;margin-top:20px;">Project Details</h3><p style="font-family:Arial,sans-serif;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>` : ""}
            ${photo ? `<p style="font-family:Arial,sans-serif;color:#666;">📎 Photo attached: ${photo.name}</p>` : ""}
          `,
          ...(attachments.length > 0 ? { attachments } : {}),
        }),
      });

      // Confirmation to customer
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "We've received your quote request — Custom Showers",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
              <div style="background:#1e40af;color:white;padding:30px;text-align:center;">
                <h1 style="margin:0;font-size:24px;">Thanks for your enquiry, ${name}!</h1>
              </div>
              <div style="padding:30px;">
                <p>We've received your quote request and a member of our team will get back to you within <strong>1 business day</strong>.</p>
                <h3 style="color:#1e40af;">Your enquiry summary:</h3>
                <table style="border-collapse:collapse;width:100%;">
                  <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;width:140px;">Service</td><td style="padding:8px;">${serviceType}</td></tr>
                  <tr><td style="padding:8px;font-weight:bold;">Address</td><td style="padding:8px;">${address}</td></tr>
                </table>
                ${message ? `<p style="margin-top:16px;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>` : ""}
                <p style="margin-top:24px;">If you need to reach us sooner: <a href="mailto:${businessEmail}" style="color:#1e40af;">${businessEmail}</a></p>
                <p style="margin-top:30px;">The Custom Showers Team</p>
              </div>
            </div>
          `,
        }),
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Worker error:", message);
      return new Response(
        JSON.stringify({ success: false, error: message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  },
};

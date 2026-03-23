import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const turnstileSecret = Deno.env.get("TURNSTILE_SECRET_KEY");
const businessEmail = Deno.env.get("BUSINESS_EMAIL") ?? "sales@customshowers.uk";
const fromAddress = Deno.env.get("FROM_EMAIL") ?? "Custom Showers <noreply@customshowers.uk>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEnquiryRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  message: string;
  turnstileToken: string;
  photo?: { name: string; type: string; data: string } | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: QuoteEnquiryRequest = await req.json();
    const { name, email, phone, address, serviceType, message, turnstileToken, photo } = body;

    // Verify Cloudflare Turnstile token
    const turnstileRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${turnstileSecret}&response=${turnstileToken}`,
      }
    );
    const turnstileResult = await turnstileRes.json();

    if (!turnstileResult.success) {
      console.error("Turnstile verification failed:", turnstileResult);
      return new Response(
        JSON.stringify({ success: false, error: "Security check failed. Please try again." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build attachment array if a photo was provided
    const attachments: { filename: string; content: string; type: string }[] = [];
    if (photo?.data) {
      attachments.push({
        filename: photo.name,
        content: photo.data,
        type: photo.type,
      });
    }

    // Notification email to business
    await resend.emails.send({
      from: fromAddress,
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
    });

    // Confirmation email to customer
    await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "We've received your quote request — Custom Showers",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
          <div style="background:#1e40af;color:white;padding:30px;text-align:center;">
            <h1 style="margin:0;font-size:24px;">Thanks for your enquiry, ${name}!</h1>
          </div>
          <div style="padding:30px;">
            <p>We've received your quote request and a member of our team will review it and get back to you within <strong>1 business day</strong>.</p>
            <h3 style="color:#1e40af;">Your enquiry summary:</h3>
            <table style="border-collapse:collapse;width:100%;">
              <tr style="background:#f9fafb;"><td style="padding:8px;font-weight:bold;width:140px;">Service</td><td style="padding:8px;">${serviceType}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Address</td><td style="padding:8px;">${address}</td></tr>
            </table>
            ${message ? `<p style="margin-top:16px;white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</p>` : ""}
            <p style="margin-top:24px;">If you need to reach us in the meantime:</p>
            <p>📧 <a href="mailto:${businessEmail}" style="color:#1e40af;">${businessEmail}</a></p>
            <p style="margin-top:30px;">The Custom Showers Team</p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-quote-enquiry:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

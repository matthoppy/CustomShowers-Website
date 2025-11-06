import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const recaptchaSecret = Deno.env.get("RECAPTCHA_SECRET_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  recaptchaToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message, recaptchaToken }: ContactRequest = await req.json();

    console.log("Contact form submission received from:", email);

    // Verify reCAPTCHA
    const recaptchaResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
      }
    );

    const recaptchaResult = await recaptchaResponse.json();
    console.log("reCAPTCHA verification result:", recaptchaResult);

    if (!recaptchaResult.success) {
      console.error("reCAPTCHA verification failed");
      return new Response(
        JSON.stringify({ error: "reCAPTCHA verification failed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to business
    const emailResponse = await resend.emails.send({
      from: "BSM Contact Form <onboarding@resend.dev>",
      to: ["info@bespokeshowersandmirrors.co.uk"],
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log("Business notification email sent:", emailResponse);

    // Send confirmation email to customer
    await resend.emails.send({
      from: "Bespoke Showers & Mirrors <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for contacting Bespoke Showers & Mirrors",
      html: `
        <h1>Thank you for your enquiry, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Here's a copy of your message:</p>
        <blockquote style="border-left: 4px solid #0066cc; padding-left: 16px; margin: 16px 0; color: #666;">
          ${message.replace(/\n/g, '<br>')}
        </blockquote>
        <p>Best regards,<br>Bespoke Showers & Mirrors Team</p>
      `,
    });

    console.log("Confirmation email sent to customer");

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

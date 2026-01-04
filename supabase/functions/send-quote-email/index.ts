import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  to: string;
  customerName: string;
  quoteNumber: string;
  quoteUrl: string;
  totalAmount: number;
  validUntil: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const getEmailTemplate = (params: QuoteEmailRequest): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from Bespoke Frameless Showers</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Your Quote is Ready!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Quote Number: ${params.quoteNumber}</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; margin: 20px 0;">
    <p style="font-size: 18px; margin-top: 0;">Hi ${params.customerName},</p>

    <p>Thank you for your interest in Bespoke Frameless Showers. We're pleased to provide you with a detailed quote for your custom shower enclosure.</p>

    <div style="background-color: white; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 16px; color: #666;">Total Quote Amount</p>
      <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e40af;">${formatCurrency(params.totalAmount)}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Including VAT</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.quoteUrl}" style="display: inline-block; background-color: #1e40af; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">View Your Quote</a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">⏰ This quote is valid until ${formatDate(params.validUntil)}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Please review and respond before this date to lock in your pricing.</p>
    </div>

    <h3 style="color: #1e40af;">What's Included:</h3>
    <ul style="padding-left: 20px;">
      <li>Premium 10mm toughened safety glass</li>
      <li>All hardware and fittings in your chosen finish</li>
      <li>Complete seal package</li>
      <li>Detailed CAD drawings</li>
      <li>Full manufacturer warranty</li>
    </ul>

    <h3 style="color: #1e40af;">Next Steps:</h3>
    <ol style="padding-left: 20px;">
      <li>Review your quote by clicking the button above</li>
      <li>Accept the quote and proceed to payment</li>
      <li>We'll contact you to arrange installation</li>
    </ol>

    <p>If you have any questions or would like to discuss your quote, please don't hesitate to contact us:</p>
    <p>
      📧 Email: <a href="mailto:sales@bespokeframelessshowers.co.uk" style="color: #1e40af;">sales@bespokeframelessshowers.co.uk</a><br>
      📞 Phone: +44 1234 567890
    </p>

    <p style="margin-top: 30px;">We look forward to working with you!</p>

    <p style="font-weight: bold;">The BFS Team</p>
  </div>

  <div style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">Bespoke Frameless Showers Ltd</p>
    <p style="margin: 5px 0;">Your trusted partner for premium shower enclosures</p>
    <p style="margin: 5px 0;">
      <a href="https://bespokeframelessshowers.co.uk" style="color: #1e40af; text-decoration: none;">www.bespokeframelessshowers.co.uk</a>
    </p>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const params: QuoteEmailRequest = await req.json();

    console.log("Sending quote email to:", params.to, "for quote:", params.quoteNumber);

    // Send quote email to customer
    const emailResponse = await resend.emails.send({
      from: "Bespoke Frameless Showers <onboarding@resend.dev>",
      to: [params.to],
      subject: `Your Quote ${params.quoteNumber} from Bespoke Frameless Showers`,
      html: getEmailTemplate(params),
    });

    console.log("Quote email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quote email sent successfully",
        emailId: emailResponse.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

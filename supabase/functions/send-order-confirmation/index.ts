import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderConfirmationRequest {
  to: string;
  customerName: string;
  orderNumber: string;
  quoteNumber: string;
  totalAmount: number;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

const getEmailTemplate = (params: OrderConfirmationRequest): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - Bespoke Frameless Showers</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #10b981; color: white; padding: 30px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">✓ Order Confirmed!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Order Number: ${params.orderNumber}</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; margin: 20px 0;">
    <p style="font-size: 18px; margin-top: 0;">Hi ${params.customerName},</p>

    <p style="font-size: 16px; font-weight: bold; color: #10b981;">Thank you for your payment!</p>

    <p>We're excited to confirm that we've received your payment for your custom frameless shower enclosure. Your order is now being processed.</p>

    <div style="background-color: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #1e40af;">Order Summary</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Order Number:</span>
        <strong>${params.orderNumber}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Quote Number:</span>
        <strong>${params.quoteNumber}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <span style="font-size: 18px; font-weight: bold;">Total Paid:</span>
        <strong style="font-size: 18px; color: #10b981;">${formatCurrency(params.totalAmount)}</strong>
      </div>
    </div>

    <div style="background-color: #dbeafe; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">✓ Payment Successful</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Your payment has been processed successfully and your order is now active.</p>
    </div>

    <h3 style="color: #1e40af;">What Happens Next?</h3>
    <ol style="padding-left: 20px;">
      <li><strong>Design Verification:</strong> We'll review your design and confirm all specifications</li>
      <li><strong>Manufacturing:</strong> Your custom shower enclosure will be manufactured to your exact requirements</li>
      <li><strong>Quality Control:</strong> Every component will be inspected to ensure premium quality</li>
      <li><strong>Delivery Coordination:</strong> We'll contact you to arrange delivery and installation</li>
    </ol>

    <h3 style="color: #1e40af;">What's Included in Your Order:</h3>
    <ul style="padding-left: 20px;">
      <li>Premium 10mm toughened safety glass</li>
      <li>All hardware and fittings in your chosen finish</li>
      <li>Complete seal package for water protection</li>
      <li>Detailed CAD drawings and installation instructions</li>
      <li>Full manufacturer warranty on all components</li>
    </ul>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">⏰ Expected Timeline</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">A member of our team will contact you within 2 business days to discuss the next steps and provide an estimated completion date.</p>
    </div>

    <h3 style="color: #1e40af;">Need Help?</h3>
    <p>If you have any questions about your order, please don't hesitate to contact us:</p>
    <p>
      📧 Email: <a href="mailto:sales@bespokeframelessshowers.co.uk" style="color: #1e40af;">sales@bespokeframelessshowers.co.uk</a><br>
      📞 Phone: +44 1234 567890
    </p>

    <p style="margin-top: 30px;">Thank you for choosing Bespoke Frameless Showers!</p>

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
    const params: OrderConfirmationRequest = await req.json();

    console.log("Sending order confirmation email to:", params.to, "for order:", params.orderNumber);

    // Send order confirmation email to customer
    const emailResponse = await resend.emails.send({
      from: "Bespoke Frameless Showers <onboarding@resend.dev>",
      to: [params.to],
      subject: `Order Confirmed ${params.orderNumber} - Thank You!`,
      html: getEmailTemplate(params),
    });

    console.log("Order confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order confirmation email sent successfully",
        emailId: emailResponse.id
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-confirmation function:", error);
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

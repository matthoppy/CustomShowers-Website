import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

const handler = async (req: Request): Promise<Response> => {
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response(
      JSON.stringify({ error: "Webhook signature missing" }),
      { status: 400 }
    );
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Received Stripe webhook event:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("Processing successful payment for session:", session.id);

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const quoteId = session.metadata?.quote_id;
      const quoteNumber = session.metadata?.quote_number;

      if (!quoteId) {
        console.error("No quote_id in session metadata");
        return new Response(
          JSON.stringify({ error: "Missing quote ID" }),
          { status: 400 }
        );
      }

      // Fetch the quote to get details including customer info
      const { data: quote, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          designs (
            *,
            customers (
              *
            )
          )
        `)
        .eq("id", quoteId)
        .single();

      if (quoteError || !quote) {
        console.error("Error fetching quote:", quoteError);
        return new Response(
          JSON.stringify({ error: "Quote not found" }),
          { status: 404 }
        );
      }

      // Update quote status to accepted
      const { error: updateError } = await supabase
        .from("quotes")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", quoteId);

      if (updateError) {
        console.error("Error updating quote:", updateError);
        throw updateError;
      }

      console.log("Quote updated to accepted:", quoteId);

      // Create an order from the accepted quote
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          design_id: quote.design_id,
          quote_id: quoteId,
          status: "pending",
          total_amount: quote.total_amount,
          payment_status: "paid",
          payment_method: "stripe",
          stripe_payment_id: session.payment_intent as string,
          notes: `Order created from quote ${quoteNumber}. Payment received via Stripe.`,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created successfully:", order.order_number);

      // Send confirmation email to customer
      const customer = quote.designs?.customers;
      if (customer?.email) {
        try {
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-order-confirmation`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: customer.email,
                customerName: customer.full_name || "Customer",
                orderNumber: order.order_number,
                quoteNumber: quoteNumber,
                totalAmount: order.total_amount,
              }),
            }
          );

          if (emailResponse.ok) {
            console.log("Order confirmation email sent to:", customer.email);
          } else {
            console.error("Failed to send order confirmation email:", await emailResponse.text());
          }
        } catch (emailError) {
          console.error("Error sending order confirmation email:", emailError);
          // Don't fail the webhook if email fails - order is still created
        }
      }

      // TODO: Generate DXF files and hardware specifications
      // TODO: Notify admin of new paid order

      return new Response(
        JSON.stringify({
          success: true,
          orderId: order.id,
          orderNumber: order.order_number,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle other event types if needed
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);

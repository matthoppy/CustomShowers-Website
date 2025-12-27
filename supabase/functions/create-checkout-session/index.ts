import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  quoteId: string;
  successUrl: string;
  cancelUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    console.log("Creating checkout session for quote:", quoteId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch quote details
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
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify quote is in valid state for payment
    if (quote.status !== "sent") {
      return new Response(
        JSON.stringify({ error: "This quote cannot be paid at this time" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if quote is expired
    if (new Date(quote.valid_until) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This quote has expired" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const customer = quote.designs?.customers;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customer?.email,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: `Bespoke Shower Enclosure - Quote ${quote.quote_number}`,
              description: "Custom frameless glass shower enclosure with premium hardware and fittings",
              images: [],
            },
            unit_amount: Math.round(quote.total_amount * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      metadata: {
        quote_id: quoteId,
        quote_number: quote.quote_number,
        customer_email: customer?.email || "",
        customer_name: customer?.full_name || "",
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

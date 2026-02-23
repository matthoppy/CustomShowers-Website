#!/bin/bash

# Custom Showers Website - Complete Deployment Commands
# Run these commands in order on your local machine

echo "🚀 Custom Showers Website Deployment Commands"
echo "===================================="
echo ""
echo "Copy and paste these commands one by one:"
echo ""

echo "# 1. Install Supabase CLI (if not already installed)"
echo "npm install -g supabase"
echo ""

echo "# 2. Login to Supabase"
echo "supabase login"
echo ""

echo "# 3. Link to your project"
echo "supabase link --project-ref plprhxtkpwklrgqaoxyj"
echo ""

echo "# 4. Set Resend API Key"
echo "supabase secrets set RESEND_API_KEY=re_ZzBMdDwN_4N7M8FDLcReeuSRpuYr3LT5A"
echo ""

echo "# 5. Set Stripe Secret Key"
echo "supabase secrets set STRIPE_SECRET_KEY=sk_test_51Sj5nLDO87gISe57a8Z9VgNT4z5BB0WdVzwx1dqCOmizTT9FYnwplNMbIoleL3gaWhe3yRB21xpIMn83sT6GCEjS00fHGX5Sh6"
echo ""

echo "# 6. Set Supabase URL"
echo "supabase secrets set SUPABASE_URL=https://plprhxtkpwklrgqaoxyj.supabase.co"
echo ""

echo "# 7. Set Supabase Service Role Key"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=sb_secret_YIv8mLlf4v3nPrdcUHBKVQ_vuwWj22D"
echo ""

echo "# 8. Deploy Edge Functions"
echo "supabase functions deploy send-quote-email"
echo "supabase functions deploy send-order-confirmation"
echo "supabase functions deploy create-checkout-session"
echo "supabase functions deploy stripe-webhook"
echo ""

echo "✅ After these deploy successfully, you need to:"
echo ""
echo "9. Configure Stripe Webhook:"
echo "   - Go to: https://dashboard.stripe.com/test/webhooks"
echo "   - Click 'Add endpoint'"
echo "   - URL: https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook"
echo "   - Event: checkout.session.completed"
echo "   - Copy the webhook signing secret"
echo ""

echo "10. Set Stripe Webhook Secret:"
echo "    supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_COPIED_SECRET"
echo ""

echo "11. Deploy to Netlify:"
echo "    - Go to: https://app.netlify.com"
echo "    - Import from GitHub: matthoppy/CustomShowers-Website"
echo "    - Add environment variables:"
echo "      VITE_SUPABASE_URL=https://plprhxtkpwklrgqaoxyj.supabase.co"
echo "      VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBscHJoeHRrcHdrbHJncWFveHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NDI5NDgsImV4cCI6MjA4MjAxODk0OH0.b0mZfY7zBzyhD6bqU4HdHXqSNUsejO1Ij5FaJ5fJCbo"
echo "    - Click Deploy"
echo ""

echo "🎉 That's it! Your site will be live!"

#!/bin/bash

# BFS Website - Supabase Deployment Script
# This script deploys Edge Functions and sets environment secrets

echo "🚀 Deploying BFS Website to Supabase..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📦 Step 1: Setting environment secrets..."
echo ""

# Stripe keys
supabase secrets set STRIPE_SECRET_KEY="sk_test_51Sj5nLDO87gISe57a8Z9VgNT4z5BB0WdVzwx1dqCOmizTT9FYnwplNMbIoleL3gaWhe3yRB21xpIMn83sT6GCEjS00fHGX5Sh6"

# Supabase keys
supabase secrets set SUPABASE_URL="https://plprhxtkpwklrgqaoxyj.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sb_secret_YIv8mLlf4v3nPrdcUHBKVQ_vuwWj22D"

# Resend API key (you need to add yours)
echo "⚠️  Please run this command with your Resend API key:"
echo "   supabase secrets set RESEND_API_KEY=re_your_key_here"
echo ""

# Stripe webhook secret (will be set after webhook is created)
echo "⚠️  After creating Stripe webhook, run:"
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret"
echo ""

echo "✅ Secrets set (except RESEND_API_KEY and STRIPE_WEBHOOK_SECRET)"
echo ""

echo "📤 Step 2: Deploying Edge Functions..."
echo ""

# Deploy all Edge Functions
supabase functions deploy send-quote-email
supabase functions deploy send-order-confirmation
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook

echo ""
echo "✅ Edge Functions deployed!"
echo ""

echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set RESEND_API_KEY: supabase secrets set RESEND_API_KEY=re_xxx"
echo "2. Configure Stripe webhook:"
echo "   URL: https://plprhxtkpwklrgqaoxyj.supabase.co/functions/v1/stripe-webhook"
echo "   Event: checkout.session.completed"
echo "3. Set webhook secret: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx"
echo "4. Deploy to Netlify with these env vars:"
echo "   VITE_SUPABASE_URL=https://plprhxtkpwklrgqaoxyj.supabase.co"
echo "   VITE_SUPABASE_PUBLISHABLE_KEY=<your_anon_key>"
echo ""

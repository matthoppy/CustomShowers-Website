#!/bin/bash
#
# Custom Showers — deploy the legacy quote/order Edge Functions.
#
# For the shower configurator, use ./scripts/deploy-configurator.sh instead.
#
# SECRETS ARE NO LONGER HARDCODED HERE. Earlier versions of this file
# contained a live Supabase service-role key, a Resend API key and a Stripe
# secret key, committed to the repository. Those values are still in git
# history, so they must be treated as compromised and rotated — removing them
# from this file does not undo the exposure.
#
# Export what you need before running, or the script will prompt:
#
#   export RESEND_API_KEY=...
#   export STRIPE_SECRET_KEY=...
#   export SUPABASE_SERVICE_ROLE_KEY=...
#
set -euo pipefail

cd "$(dirname "$0")"

echo "🚀 Deploying Custom Showers Edge Functions..."
echo ""

if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# The project ref comes from .env, which is what the built front end actually
# connects to. Do not hardcode it — this repo has carried a stale ref before.
if [ ! -f .env ]; then
    echo "❌ .env not found; it holds the project ref this site connects to."
    exit 1
fi

PROJECT_REF="$(grep -E '^VITE_SUPABASE_PROJECT_ID=' .env | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
if [ -z "$PROJECT_REF" ]; then
    echo "❌ VITE_SUPABASE_PROJECT_ID missing from .env"
    exit 1
fi

echo "Project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"
echo ""

set_secret() {
    local name="$1" value="${!1:-}"
    if [ -z "$value" ]; then
        read -r -p "  $name (blank to skip): " value
    fi
    if [ -n "$value" ]; then
        supabase secrets set "$name=$value" > /dev/null
        echo "  ✓ $name set"
    else
        echo "  – $name skipped"
    fi
}

echo "📦 Step 1: Secrets"
set_secret RESEND_API_KEY
set_secret STRIPE_SECRET_KEY
set_secret SUPABASE_SERVICE_ROLE_KEY
set_secret STRIPE_WEBHOOK_SECRET
echo ""

echo "📤 Step 2: Deploying Edge Functions..."
supabase functions deploy send-quote-email
supabase functions deploy send-order-confirmation
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
echo ""

echo "✅ Done."
echo ""
echo "📋 Next steps:"
echo "1. Configure the Stripe webhook:"
echo "   URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "   Event: checkout.session.completed"
echo "2. Set the webhook secret: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx"
echo ""

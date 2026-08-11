#!/bin/bash
#
# Custom Showers — deployment walkthrough.
#
# Prints the commands to run. It does not run them, and it no longer contains
# any secret values.
#
# Earlier versions of this file listed a live Supabase service-role key, a
# Resend API key and a Stripe secret key inline. Those are still in git
# history and must be rotated — deleting them from this file does not undo
# the exposure.
#
# For the shower configurator specifically, ./scripts/deploy-configurator.sh
# does all of this for you.

PROJECT_REF="$(grep -E '^VITE_SUPABASE_PROJECT_ID=' .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
PROJECT_REF="${PROJECT_REF:-<your-project-ref>}"

cat <<EOF
🚀 Custom Showers Website Deployment
====================================

Project ref (read from .env): $PROJECT_REF

Run these in order:

# 1. Install the Supabase CLI
npm install -g supabase

# 2. Log in
supabase login

# 3. Link the project
supabase link --project-ref $PROJECT_REF

# 4. Set secrets. Paste the real values — never commit them.
supabase secrets set RESEND_API_KEY=...
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...

# 5. Deploy the shower configurator enquiry function
supabase functions deploy send-design-enquiry
#    …or use the script, which checks secrets first:
#    ./scripts/deploy-configurator.sh

# 6. Deploy the quote and order functions
supabase functions deploy send-quote-email
supabase functions deploy send-order-confirmation
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook

Then:

7. Configure the Stripe webhook
   https://dashboard.stripe.com/test/webhooks
   URL:   https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook
   Event: checkout.session.completed

8. Set the webhook secret
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

9. Ship the front end
   The site builds from git on Cloudflare Pages — merging to main deploys it.
   Build command: npm run build     Output directory: dist
   Environment variables (Pages → Settings → Environment variables):
     VITE_SUPABASE_URL=https://$PROJECT_REF.supabase.co
     VITE_SUPABASE_PROJECT_ID=$PROJECT_REF
     VITE_SUPABASE_PUBLISHABLE_KEY=<the publishable/anon key>

EOF

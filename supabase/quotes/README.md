# Quotes and orders

Supabase project: **Custom Showers** (`gjfzlvddtqyirtjcebjg`, London).
Separate from the older project the legacy admin pages point at.

## How it works

1. Customer sends a design → `quote-submit` saves it with drawings, site
   readings and tape photos, and emails the admin a private review link.
2. Admin opens `/quote/:id/review?k=…`, edits the suggested price, presses
   **Send price** → customer gets `/quote/:id?k=…`.
3. Customer checks sizes and confirms (or asks for a change, which emails the
   admin), adds extras, and pays through Stripe Checkout with a delivery
   address.
4. `quote-stripe-webhook` marks it paid and emails the admin the glass order
   (ready to forward to the supplier), pick list and delivery address. The
   customer gets a receipt.

The links' `k` token is the only access control: no logins, and no table is
readable from the browser (RLS on, no policies).

## Prices

- Suggested price: `src/configurator/pricing.ts` (`RATES`, placeholder values).
- Extras: the `extras_catalog` table — shelf prices in pence, VAT included.
  Edit in the Supabase table editor.

## Secrets (Edge Functions → Secrets)

| Name | Needed for |
| --- | --- |
| `RESEND_API_KEY` | Every email. Use the same key as the Cloudflare worker. |
| `STRIPE_SECRET_KEY` | Payments (`sk_test_…` to try it, `sk_live_…` for real). |
| `STRIPE_WEBHOOK_SECRET` | Marking quotes paid. From the webhook below. |
| `TURNSTILE_SECRET_KEY` | Optional. Same value as the worker's, to keep bot checks. |
| `ADMIN_EMAIL` | Optional. Defaults to `sales@customshowers.uk`. |
| `SITE_URL` | Optional. Defaults to `https://customshowers.uk`. |

## Stripe webhook

Stripe → Developers → Webhooks → Add endpoint:

- URL: `https://gjfzlvddtqyirtjcebjg.supabase.co/functions/v1/quote-stripe-webhook`
- Event: `checkout.session.completed`

Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

## Deploying changes

Functions live in `functions/` with shared code in `functions/_shared/`.
Deploy with `verify_jwt` off (they check their own tokens or Stripe's
signature). They are kept apart from the legacy `supabase/functions` folder,
so to use the CLI, copy `quote-*` and `_shared` into a `supabase/functions`
folder first and run `supabase functions deploy <name> --no-verify-jwt
--project-ref gjfzlvddtqyirtjcebjg`.

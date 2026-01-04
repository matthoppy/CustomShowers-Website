# Create Checkout Session Edge Function

This Supabase Edge Function creates a Stripe checkout session for quote payments.

## Features

- Validates quote status and expiry before creating checkout
- Creates Stripe checkout session with quote details
- Includes quote metadata for webhook processing
- Returns checkout URL for redirect

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy create-checkout-session
```

## Environment Variables

Set the following environment variables in your Supabase project:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://yourproject.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting Stripe Keys

1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy your Secret key (starts with `sk_test_` for test mode)
4. For production, use Live mode keys

## Usage

Called automatically from the frontend when a customer clicks "Accept & Pay Now" on the quote view page.

### Request Body

```typescript
{
  quoteId: string;      // UUID of the quote
  successUrl: string;   // URL to redirect after successful payment
  cancelUrl: string;    // URL to redirect if payment is cancelled
}
```

### Response

Success:
```json
{
  "success": true,
  "sessionId": "cs_test_xxxxxxxxxxxxx",
  "url": "https://checkout.stripe.com/pay/cs_test_xxxxxxxxxxxxx"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Validations

The function performs these validations:
- Quote exists in database
- Quote status is 'sent' (not already accepted/rejected)
- Quote has not expired (valid_until date)

## Security

- Uses Supabase service role key to bypass RLS policies
- Validates quote state before creating checkout
- Includes metadata for webhook verification
- Stripe handles all PCI compliance for payment processing

## Testing

Test locally:

```bash
supabase functions serve create-checkout-session
```

Make a POST request:

```bash
curl -X POST http://localhost:54321/functions/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "your-quote-uuid",
    "successUrl": "http://localhost:5173/quote/your-quote-uuid?payment=success",
    "cancelUrl": "http://localhost:5173/quote/your-quote-uuid?payment=cancelled"
  }'
```

Use Stripe test cards for testing:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- See more at https://stripe.com/docs/testing

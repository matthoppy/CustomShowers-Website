# Stripe Webhook Edge Function

This Supabase Edge Function handles Stripe webhook events for payment processing.

## Features

- Validates webhook signatures for security
- Processes successful payment events
- Updates quote status to 'accepted'
- Creates order records in database
- Extensible for additional webhook events

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy stripe-webhook
```

## Environment Variables

Set the following environment variables in your Supabase project:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://yourproject.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Getting Webhook Secret

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourproject.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to: `checkout.session.completed`
5. Copy the webhook signing secret (starts with `whsec_`)

## Webhook Configuration

Configure the webhook in Stripe Dashboard to listen for:
- `checkout.session.completed` - Triggered when a checkout session is successfully completed

Add more events as needed:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

## What It Does

When a `checkout.session.completed` event is received:

1. **Validates** the webhook signature for security
2. **Extracts** quote ID from session metadata
3. **Updates** quote status to 'accepted' and sets accepted_at timestamp
4. **Creates** an order record with:
   - Auto-generated order number (CS-YYYYMMDD-XXXX)
   - Status: 'pending'
   - Payment status: 'paid'
   - Stripe payment ID for reference
5. **Returns** success response

## Database Changes

### Quotes Table
- Sets `status = 'accepted'`
- Sets `accepted_at = NOW()`

### Orders Table
Creates new record with:
```sql
{
  design_id: UUID,
  quote_id: UUID,
  order_number: "CS-YYYYMMDD-XXXX" (auto-generated),
  status: "pending",
  total_amount: DECIMAL,
  payment_status: "paid",
  payment_method: "stripe",
  stripe_payment_id: STRING,
  notes: TEXT
}
```

## Security

- Validates webhook signatures using Stripe webhook secret
- Rejects unsigned or invalid webhooks
- Uses Supabase service role key for database access
- Idempotent - safe to receive duplicate events

## Testing

### Test Locally

1. Start the function:
```bash
supabase functions serve stripe-webhook
```

2. Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

3. Trigger a test event:
```bash
stripe trigger checkout.session.completed
```

### Test in Production

1. Use Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Check function logs in Supabase dashboard

## Error Handling

The function handles these error cases:
- Missing or invalid webhook signature → 400 Bad Request
- Quote not found → 404 Not Found
- Database errors → 500 Internal Server Error
- Missing metadata → 400 Bad Request

All errors are logged to Supabase function logs.

## Future Enhancements

TODOs marked in code:
- [ ] Send confirmation email to customer
- [ ] Generate DXF files and hardware specifications
- [ ] Notify admin of new paid order
- [ ] Handle refund events
- [ ] Handle failed payment events

## Monitoring

Monitor webhook events in:
- Stripe Dashboard → Developers → Events
- Supabase Dashboard → Edge Functions → Logs
- Check `orders` table for new records
- Check `quotes` table for status updates

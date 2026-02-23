# Send Quote Email Edge Function

This Supabase Edge Function sends professional quote emails to customers with a link to view and accept their quote.

## Features

- Sends beautifully formatted HTML email with quote details
- Includes direct link to customer quote view page
- Shows total amount, valid until date, and what's included
- Uses Resend for reliable email delivery

## Deployment

Deploy this function to Supabase:

```bash
supabase functions deploy send-quote-email
```

## Environment Variables

Set the following environment variable in your Supabase project:

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
```

You can get a Resend API key by:
1. Sign up at https://resend.com
2. Create an API key in the dashboard
3. Add it to Supabase secrets

## Usage

This function is called automatically from the frontend when an admin sends a quote to a customer from the Admin Quote Detail page.

### Request Body

```typescript
{
  to: string;              // Customer email address
  customerName: string;    // Customer's name
  quoteNumber: string;     // Quote number (e.g., "Q-20241223-0001")
  quoteUrl: string;        // Full URL to view the quote
  totalAmount: number;     // Total quote amount in GBP
  validUntil: string;      // ISO date string for quote expiry
}
```

### Response

Success:
```json
{
  "success": true,
  "message": "Quote email sent successfully",
  "emailId": "email_id_from_resend"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Email Customization

To customize the email template:
1. Edit the `getEmailTemplate()` function in `index.ts`
2. Update branding colors, content, or layout
3. Redeploy the function

## Testing

Test the function locally:

```bash
supabase functions serve send-quote-email
```

Then make a POST request:

```bash
curl -X POST http://localhost:54321/functions/v1/send-quote-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "customerName": "John Doe",
    "quoteNumber": "Q-20241223-0001",
    "quoteUrl": "https://yoursite.com/quote/123",
    "totalAmount": 1500.00,
    "validUntil": "2024-12-30T23:59:59Z"
  }'
```

## Notes

- The function uses Resend's sandbox domain `onboarding@resend.dev` by default
- For production, verify your domain in Resend and update the `from` address
- Emails are formatted with Custom Showers branding and UK formatting (GBP currency, UK date format)

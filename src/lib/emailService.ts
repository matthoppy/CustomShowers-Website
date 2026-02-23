/**
 * Email Service
 * Handles sending quote emails to customers
 */

import { supabase } from '@/integrations/supabase/client';

export interface SendQuoteEmailParams {
  quoteId: string;
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  validUntil: Date;
}

/**
 * Send quote email to customer
 * This will invoke a Supabase Edge Function to send the email
 */
export async function sendQuoteEmail(params: SendQuoteEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate quote view URL
    const quoteUrl = `${window.location.origin}/quote/${params.quoteId}`;

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-quote-email', {
      body: {
        to: params.customerEmail,
        customerName: params.customerName,
        quoteNumber: params.quoteNumber,
        quoteUrl,
        totalAmount: params.totalAmount,
        validUntil: params.validUntil.toISOString(),
      },
    });

    if (error) {
      console.error('Error sending quote email:', error);
      return { success: false, error: error.message };
    }

    // Update quote status to 'sent'
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', params.quoteId);

    if (updateError) {
      console.error('Error updating quote status:', updateError);
      return { success: false, error: 'Email sent but failed to update quote status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error sending quote email:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Email template for quote notification
 * This is a reference - actual template will be in the Edge Function
 */
export const QUOTE_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quote from Custom Showers</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1e40af; color: white; padding: 30px; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">Your Quote is Ready!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">Quote Number: {{QUOTE_NUMBER}}</p>
  </div>

  <div style="background-color: #f9fafb; padding: 30px; margin: 20px 0;">
    <p style="font-size: 18px; margin-top: 0;">Hi {{CUSTOMER_NAME}},</p>

    <p>Thank you for your interest in Custom Showers. We're pleased to provide you with a detailed quote for your custom shower enclosure.</p>

    <div style="background-color: white; border: 2px solid #1e40af; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; font-size: 16px; color: #666;">Total Quote Amount</p>
      <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: #1e40af;">{{TOTAL_AMOUNT}}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Including VAT</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{QUOTE_URL}}" style="display: inline-block; background-color: #1e40af; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">View Your Quote</a>
    </div>

    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">⏰ This quote is valid until {{VALID_UNTIL}}</p>
      <p style="margin: 5px 0 0 0; font-size: 14px;">Please review and respond before this date to lock in your pricing.</p>
    </div>

    <h3 style="color: #1e40af;">What's Included:</h3>
    <ul style="padding-left: 20px;">
      <li>Premium 10mm toughened safety glass</li>
      <li>All hardware and fittings in your chosen finish</li>
      <li>Complete seal package</li>
      <li>Detailed CAD drawings</li>
      <li>Full manufacturer warranty</li>
    </ul>

    <h3 style="color: #1e40af;">Next Steps:</h3>
    <ol style="padding-left: 20px;">
      <li>Review your quote by clicking the button above</li>
      <li>Accept the quote and proceed to payment</li>
      <li>We'll contact you to arrange installation</li>
    </ol>

    <p>If you have any questions or would like to discuss your quote, please don't hesitate to contact us:</p>
    <p>
      📧 Email: <a href="mailto:sales@customshowers.uk" style="color: #1e40af;">sales@customshowers.uk</a><br>
      📞 Phone: +44 (0)20 1234 5678
    </p>

    <p style="margin-top: 30px;">We look forward to working with you!</p>

    <p style="font-weight: bold;">The Custom Showers Team</p>
  </div>

  <div style="background-color: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p style="margin: 0;">Custom Showers</p>
    <p style="margin: 5px 0;">Your trusted partner for premium shower enclosures</p>
    <p style="margin: 5px 0;">
      <a href="https://customshowers.uk" style="color: #1e40af; text-decoration: none;">www.customshowers.uk</a>
    </p>
  </div>
</body>
</html>
`;

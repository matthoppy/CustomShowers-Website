// Stripe tells us a quote has been paid. Mark it, then send the admin the
// order ready to forward to the glass supplier, and the customer a receipt.
//
// In Stripe: Developers → Webhooks → add endpoint
//   https://<project>.supabase.co/functions/v1/quote-stripe-webhook
// event: checkout.session.completed. Put its signing secret in
// STRIPE_WEBHOOK_SECRET.

import { adminPaid, customerPaid, supplierOrderText } from '../_shared/emails.ts';
import { db, env, fileAttachments, json, sendEmail, type QuoteRow } from '../_shared/util.ts';

const TOLERANCE_S = 5 * 60;

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function verify(payload: string, header: string | null): Promise<boolean> {
  if (!header || !env.stripeWebhookSecret) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i), p.slice(i + 1)];
    })
  );
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return false;
  const expected = await hmacHex(env.stripeWebhookSecret, `${t}.${payload}`);
  const given = header
    .split(',')
    .filter((p) => p.startsWith('v1='))
    .map((p) => p.slice(3));
  return given.some((g) => g.length === expected.length && [...g].every((ch, i) => ch === expected[i]));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const payload = await req.text();
  if (!(await verify(payload, req.headers.get('stripe-signature')))) {
    return json({ error: 'Bad signature' }, 400);
  }

  const event = JSON.parse(payload);
  if (event.type !== 'checkout.session.completed') return json({ received: true });

  const session = event.data.object;
  if (session.payment_status !== 'paid') return json({ received: true });

  const quoteId = session.metadata?.quote_id ?? session.client_reference_id;
  if (!quoteId) return json({ received: true });

  const shipping = session.collected_information?.shipping_details ?? session.shipping_details ?? null;
  const delivery = {
    name: shipping?.name ?? session.customer_details?.name ?? null,
    phone: session.customer_details?.phone ?? null,
    address: shipping?.address ?? session.customer_details?.address ?? null,
  };

  const client = db();
  // Only the first delivery of this event moves the quote on; Stripe retries.
  const { data } = await client
    .from('quotes')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      amount_paid_pence: session.amount_total,
      stripe_session_id: session.id,
      delivery,
    })
    .eq('id', quoteId)
    .eq('status', 'sizes_confirmed')
    .select('*')
    .maybeSingle();

  const q = data as QuoteRow | null;
  if (!q) return json({ received: true, duplicate: true });

  await sendEmail({
    to: [env.adminEmail],
    reply_to: q.customer.email,
    ...adminPaid(q, supplierOrderText(q)),
    attachments: await fileAttachments(client, q, ['drawing', 'record']),
  });
  await sendEmail({ to: [q.customer.email], reply_to: env.adminEmail, ...customerPaid(q) });

  return json({ received: true });
});

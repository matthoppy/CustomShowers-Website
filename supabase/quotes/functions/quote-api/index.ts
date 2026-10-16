// Everything after submission, for both sides of a quote.
//
// The caller proves who they are with the token from their email link:
// customer_token for the customer page, admin_token for the review page.
// Every action checks the quote is in a state where it makes sense, so a
// stale tab can't, say, change extras after payment.

import { adminChangeRequest, customerPrice, supplierOrderText } from '../_shared/emails.ts';
import {
  cleanPrice,
  cors,
  customerUrl,
  db,
  env,
  extrasTotal,
  json,
  sameToken,
  sendEmail,
  type ExtraLine,
  type QuoteRow,
} from '../_shared/util.ts';

type Role = 'admin' | 'customer';

const EDITABLE_PRICE: string[] = ['submitted', 'change_requested', 'priced'];

async function signedFiles(client: ReturnType<typeof db>, q: QuoteRow) {
  const out = [];
  for (const f of q.files) {
    const { data } = await client.storage.from('quote-files').createSignedUrl(f.path, 60 * 60);
    if (data?.signedUrl) out.push({ ...f, url: data.signedUrl });
  }
  return out;
}

async function catalog(client: ReturnType<typeof db>) {
  const { data } = await client
    .from('extras_catalog')
    .select('id, name, description, price_pence, max_qty')
    .eq('active', true)
    .order('sort');
  // Catalog prices are shelf prices, VAT included, so £8.99 stays £8.99.
  return data ?? [];
}

async function view(client: ReturnType<typeof db>, q: QuoteRow, role: Role) {
  const common = {
    id: q.id,
    ref: q.ref,
    role,
    status: q.status,
    created_at: q.created_at,
    customer: q.customer,
    design: q.design,
    price: q.price,
    price_note: q.price_note,
    price_sent_at: q.price_sent_at,
    change_request: q.change_request,
    sizes_confirmed_at: q.sizes_confirmed_at,
    extras: q.extras,
    amount_paid_pence: q.amount_paid_pence,
    paid_at: q.paid_at,
    delivery: q.delivery,
    files: await signedFiles(client, q),
    catalog: await catalog(client),
    vat_rate: env.vatRate,
  };
  if (role === 'customer') {
    return { ...common, files: common.files.filter((f) => f.kind === 'drawing') };
  }
  return {
    ...common,
    site_record: q.site_record,
    suggested_price: q.suggested_price,
    ordered_at: q.ordered_at,
    supplier_text: supplierOrderText(q),
    customer_url: customerUrl(q),
  };
}

async function priceExtras(client: ReturnType<typeof db>, items: unknown): Promise<ExtraLine[] | null> {
  if (!Array.isArray(items) || items.length > 30) return null;
  const list = await catalog(client);
  const out: ExtraLine[] = [];
  for (const it of items) {
    const id = String((it as { id?: unknown })?.id ?? '');
    const qty = Math.round(Number((it as { qty?: unknown })?.qty));
    const item = list.find((e) => e.id === id);
    if (!item || !Number.isFinite(qty)) return null;
    if (qty <= 0) continue;
    const q = Math.min(qty, item.max_qty);
    out.push({ id, name: item.name, qty: q, unit_pence: item.price_pence, total_pence: item.price_pence * q });
  }
  return out;
}

async function stripeCheckout(q: QuoteRow): Promise<{ url?: string; id?: string; error?: string }> {
  if (!env.stripeKey) return { error: 'Card payments aren’t switched on yet. Please email us to pay.' };
  if (!q.price) return { error: 'This quote has no price yet.' };

  const form = new URLSearchParams();
  form.set('mode', 'payment');
  form.set('customer_email', q.customer.email);
  form.set('client_reference_id', q.id);
  form.set('metadata[quote_id]', q.id);
  form.set('metadata[ref]', q.ref);
  form.set('payment_intent_data[metadata][quote_id]', q.id);
  form.set('shipping_address_collection[allowed_countries][0]', 'GB');
  form.set('phone_number_collection[enabled]', 'true');
  form.set('success_url', `${customerUrl(q)}&paid=1`);
  form.set('cancel_url', customerUrl(q));

  let i = 0;
  const add = (name: string, unit: number, qty: number) => {
    form.set(`line_items[${i}][price_data][currency]`, 'gbp');
    form.set(`line_items[${i}][price_data][product_data][name]`, name);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(unit));
    form.set(`line_items[${i}][quantity]`, String(qty));
    i++;
  };
  add(`Frameless shower glass — ${q.ref} (inc VAT)`, q.price.total_pence, 1);
  for (const e of q.extras) add(e.name, e.unit_pence, e.qty);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('[checkout] stripe error', data);
    return { error: 'We couldn’t start the payment. Please try again.' };
  }
  return { url: data.url, id: data.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const id = String(body.id ?? '');
  const token = String(body.token ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id) || !token) return json({ error: 'Quote not found' }, 404);

  const client = db();
  const { data: row } = await client.from('quotes').select('*').eq('id', id).maybeSingle();
  const q = row as QuoteRow | null;
  const role: Role | null = !q
    ? null
    : sameToken(token, q.admin_token)
      ? 'admin'
      : sameToken(token, q.customer_token)
        ? 'customer'
        : null;
  if (!q || !role) return json({ error: 'Quote not found' }, 404);

  const update = async (patch: Record<string, unknown>, expected: string[]) => {
    // The status guard is in the WHERE clause, so two tabs can't both win.
    const { data } = await client
      .from('quotes')
      .update(patch)
      .eq('id', q.id)
      .in('status', expected)
      .select('*')
      .maybeSingle();
    return data as QuoteRow | null;
  };

  const action = String(body.action ?? 'get');
  const adminOnly = ['save_price', 'send_price', 'mark_ordered', 'cancel'];
  const customerOnly = ['request_change', 'confirm_sizes', 'set_extras', 'checkout'];
  if ((adminOnly.includes(action) && role !== 'admin') || (customerOnly.includes(action) && role !== 'customer')) {
    return json({ error: 'Not allowed' }, 403);
  }

  switch (action) {
    case 'get':
      return json(await view(client, q, role));

    case 'save_price':
    case 'send_price': {
      if (!EDITABLE_PRICE.includes(q.status)) return json({ error: 'The price can’t be changed at this stage.' }, 409);
      const price = cleanPrice(body.price);
      if (!price) return json({ error: 'Check the price lines — each needs a description, quantity and price.' }, 400);
      const note = typeof body.note === 'string' ? body.note.trim().slice(0, 2000) || null : q.price_note;
      const patch: Record<string, unknown> = { price, price_note: note };
      if (action === 'send_price') {
        Object.assign(patch, { status: 'priced', price_sent_at: new Date().toISOString(), change_request: null });
      }
      const next = await update(patch, EDITABLE_PRICE);
      if (!next) return json({ error: 'This quote changed in the meantime. Reload and try again.' }, 409);
      if (action === 'send_price') {
        const sent = await sendEmail({ to: [next.customer.email], reply_to: env.adminEmail, ...customerPrice(next) });
        return json({ ...(await view(client, next, role)), emailed: sent });
      }
      return json(await view(client, next, role));
    }

    case 'request_change': {
      const message = String(body.message ?? '').trim().slice(0, 2000);
      if (!message) return json({ error: 'Tell us what needs changing.' }, 400);
      const next = await update({ status: 'change_requested', change_request: message }, ['priced', 'sizes_confirmed']);
      if (!next) return json({ error: 'This quote can’t be changed now. Please email us.' }, 409);
      await sendEmail({ to: [env.adminEmail], reply_to: next.customer.email, ...adminChangeRequest(next) });
      return json(await view(client, next, role));
    }

    case 'confirm_sizes': {
      if (body.confirmed !== true) return json({ error: 'Please tick to confirm your sizes.' }, 400);
      const next = await update({ status: 'sizes_confirmed', sizes_confirmed_at: new Date().toISOString() }, ['priced']);
      if (!next) return json({ error: 'This quote can’t be confirmed now. Reload the page.' }, 409);
      return json(await view(client, next, role));
    }

    case 'set_extras':
    case 'checkout': {
      if (q.status !== 'sizes_confirmed') return json({ error: 'Confirm your sizes first.' }, 409);
      let current = q;
      if (body.items !== undefined) {
        const extras = await priceExtras(client, body.items);
        if (!extras) return json({ error: 'Something in your extras isn’t available. Reload and try again.' }, 400);
        const next = await update({ extras }, ['sizes_confirmed']);
        if (!next) return json({ error: 'This quote changed. Reload the page.' }, 409);
        current = next;
      }
      if (action === 'set_extras') return json(await view(client, current, role));

      const session = await stripeCheckout(current);
      if (session.error || !session.url) return json({ error: session.error ?? 'Payment unavailable' }, 502);
      await client.from('quotes').update({ stripe_session_id: session.id }).eq('id', q.id);
      return json({
        url: session.url,
        total_pence: (current.price?.total_pence ?? 0) + extrasTotal(current.extras),
      });
    }

    case 'mark_ordered': {
      const next = await update({ status: 'ordered', ordered_at: new Date().toISOString() }, ['paid']);
      if (!next) return json({ error: 'Only paid orders can be marked as ordered.' }, 409);
      return json(await view(client, next, role));
    }

    case 'cancel': {
      const next = await update({ status: 'cancelled' }, ['submitted', 'priced', 'change_requested', 'sizes_confirmed']);
      if (!next) return json({ error: 'This quote can’t be cancelled now.' }, 409);
      return json(await view(client, next, role));
    }

    default:
      return json({ error: 'Unknown action' }, 400);
  }
});

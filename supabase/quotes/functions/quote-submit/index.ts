// Takes a finished design from the website, stores it, and tells the admin
// there's a price to check. Public endpoint: spam checks happen here.

import { adminNewQuote, customerReceived } from '../_shared/emails.ts';
import { cleanPrice, cors, db, env, fileAttachments, json, sendEmail, type QuoteRow } from '../_shared/util.ts';

const MAX_BODY_BYTES = 15 * 1024 * 1024;
const MAX_FILES = 12;
const MAX_FILE_B64 = 4 * 1024 * 1024;
const PER_EMAIL_PER_HOUR = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_NAME = /^[a-z0-9][a-z0-9._-]{0,80}\.(png|jpe?g|txt)$/i;

const CONTENT_TYPES: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain; charset=utf-8' };

async function turnstileOk(token: unknown, ip: string | null): Promise<boolean> {
  if (!env.turnstileSecret) return true;
  if (typeof token !== 'string' || !token) return false;
  const body = new FormData();
  body.append('secret', env.turnstileSecret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  return data.success === true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const length = Number(req.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return json({ error: 'That upload is too large. Try removing some photos.' }, 413);

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  // Bots that fill the hidden field get a cheerful nothing.
  if (body.antispam?.honeypot) return json({ ok: true, ref: 'CS-000000-0000' });

  const c = body.customer ?? {};
  const customer = {
    name: String(c.name ?? '').trim().slice(0, 120),
    email: String(c.email ?? '').trim().toLowerCase().slice(0, 200),
    phone: String(c.phone ?? '').trim().slice(0, 40),
    postcode: String(c.postcode ?? '').trim().toUpperCase().slice(0, 12),
    notes: String(c.notes ?? '').trim().slice(0, 2000),
  };
  if (!customer.name || !EMAIL_RE.test(customer.email)) {
    return json({ error: 'Please enter your name and a valid email address.' }, 400);
  }

  const spec = body.spec;
  if (!spec || !Array.isArray(spec.panels) || !spec.panels.length || spec.panels.length > 12 || !body.state) {
    return json({ error: 'The design is missing. Please go back and try again.' }, 400);
  }

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!(await turnstileOk(body.turnstileToken, ip))) {
    return json({ error: 'We couldn’t verify you’re not a robot. Please refresh the page and try again.' }, 403);
  }

  const client = db();

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await client
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('customer->>email', customer.email)
    .gte('created_at', since);
  if ((count ?? 0) >= PER_EMAIL_PER_HOUR) {
    return json({ error: 'You’ve sent several designs in the last hour. Please wait a little, or email us.' }, 429);
  }

  const { data: inserted, error } = await client
    .from('quotes')
    .insert({
      customer,
      design: { state: body.state, spec, summary: body.summary ?? {} },
      site_record: typeof body.siteRecord === 'string' ? body.siteRecord.slice(0, 20000) : null,
      suggested_price: cleanPrice(body.suggestedPrice),
    })
    .select('*')
    .single();
  if (error || !inserted) {
    console.error('[submit] insert failed', error);
    return json({ error: 'We couldn’t save your design. Please try again.' }, 500);
  }
  let quote = inserted as QuoteRow;

  // Files: drawings, site readings, tape photos.
  const files: QuoteRow['files'] = [];
  const incoming = Array.isArray(body.attachments) ? body.attachments.slice(0, MAX_FILES) : [];
  for (const a of incoming) {
    const filename = String(a?.filename ?? '');
    const content = String(a?.content ?? '');
    if (!SAFE_NAME.test(filename) || !content || content.length > MAX_FILE_B64) continue;
    const ext = filename.split('.').pop()!.toLowerCase();
    let bytes: Uint8Array;
    try {
      bytes = Uint8Array.from(atob(content), (ch) => ch.charCodeAt(0));
    } catch {
      continue;
    }
    const path = `${quote.id}/${filename}`;
    const { error: upErr } = await client.storage
      .from('quote-files')
      .upload(path, bytes, { contentType: CONTENT_TYPES[ext], upsert: true });
    if (upErr) {
      console.error('[submit] upload failed', path, upErr);
      continue;
    }
    const kind = ext === 'txt' ? 'record' : filename.startsWith('tape-') ? 'photo' : 'drawing';
    files.push({ path, label: filename, kind });
  }
  if (files.length) {
    const { data } = await client.from('quotes').update({ files }).eq('id', quote.id).select('*').single();
    if (data) quote = data as QuoteRow;
  }

  // Tell the admin first; that's the email that gets the customer a price.
  const adminMail = adminNewQuote(quote);
  await sendEmail({
    to: [env.adminEmail],
    reply_to: customer.email,
    ...adminMail,
    attachments: await fileAttachments(client, quote),
  });
  await sendEmail({ to: [customer.email], ...customerReceived(quote) });

  return json({ ok: true, ref: quote.ref });
});

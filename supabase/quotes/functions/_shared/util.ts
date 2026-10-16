// Shared helpers for the quote functions.
//
// Secrets (set in Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY         required to send any email
//   STRIPE_SECRET_KEY      required for payment
//   STRIPE_WEBHOOK_SECRET  required for the stripe webhook
//   TURNSTILE_SECRET_KEY   optional; when set, design submissions must pass Turnstile
//   ADMIN_EMAIL            where new designs and paid orders go (default sales@customshowers.uk)
//   FROM_EMAIL             sender (default "Custom Showers <noreply@customshowers.uk>")
//   SITE_URL               public site for links in emails (default https://customshowers.uk)
//   VAT_RATE               default 0.2
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const env = {
  siteUrl: (Deno.env.get('SITE_URL') ?? 'https://customshowers.uk').replace(/\/$/, ''),
  adminEmail: Deno.env.get('ADMIN_EMAIL') ?? 'sales@customshowers.uk',
  fromEmail: Deno.env.get('FROM_EMAIL') ?? 'Custom Showers <noreply@customshowers.uk>',
  vatRate: Number(Deno.env.get('VAT_RATE') ?? '0.2'),
  resendKey: Deno.env.get('RESEND_API_KEY') ?? '',
  stripeKey: Deno.env.get('STRIPE_SECRET_KEY') ?? '',
  stripeWebhookSecret: Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
  turnstileSecret: Deno.env.get('TURNSTILE_SECRET_KEY') ?? '',
};

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

export function db(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
}

/** Constant-time compare, so a token can't be guessed a character at a time. */
export function sameToken(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const gbp = (pence: number) =>
  `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// -----------------------------------------------------------------------------
// Prices
// -----------------------------------------------------------------------------

export interface PriceLine {
  description: string;
  qty: number;
  unit_pence: number;
  total_pence: number;
  category: string;
}

export interface Price {
  lines: PriceLine[];
  subtotal_pence: number;
  vat_pence: number;
  total_pence: number;
  vat_rate: number;
}

export interface ExtraLine {
  id: string;
  name: string;
  qty: number;
  /** Including VAT — extras are shown and charged as shelf prices. */
  unit_pence: number;
  total_pence: number;
}

/** Re-totals lines the admin sent, so the stored price can't disagree with itself. */
export function cleanPrice(raw: unknown, vatRate = env.vatRate): Price | null {
  if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { lines?: unknown }).lines)) return null;
  const lines: PriceLine[] = [];
  for (const l of (raw as { lines: unknown[] }).lines) {
    const r = l as Record<string, unknown>;
    const description = String(r.description ?? '').trim().slice(0, 200);
    const qty = Math.round(Number(r.qty));
    const unit = Math.round(Number(r.unit_pence));
    if (!description || !Number.isFinite(qty) || !Number.isFinite(unit) || qty < 1 || qty > 999 || Math.abs(unit) > 10_000_000) {
      return null;
    }
    lines.push({ description, qty, unit_pence: unit, total_pence: qty * unit, category: String(r.category ?? 'other').slice(0, 20) });
  }
  if (!lines.length || lines.length > 60) return null;
  const subtotal = lines.reduce((s, l) => s + l.total_pence, 0);
  if (subtotal <= 0) return null;
  const vat = Math.round(subtotal * vatRate);
  return { lines, subtotal_pence: subtotal, vat_pence: vat, total_pence: subtotal + vat, vat_rate: vatRate };
}

export function extrasTotal(extras: ExtraLine[]): number {
  return extras.reduce((s, e) => s + e.total_pence, 0);
}

// -----------------------------------------------------------------------------
// Email
// -----------------------------------------------------------------------------

export interface MailAttachment {
  filename: string;
  content: string; // base64
}

export async function sendEmail(msg: {
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
  attachments?: MailAttachment[];
}): Promise<boolean> {
  if (!env.resendKey) {
    console.warn('[email] RESEND_API_KEY not set — skipped:', msg.subject);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.fromEmail, ...msg }),
  });
  if (!res.ok) {
    console.error('[email] send failed', res.status, await res.text().catch(() => ''));
    return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Links
// -----------------------------------------------------------------------------

export interface QuoteRow {
  id: string;
  ref: string;
  status: string;
  created_at: string;
  customer: { name: string; email: string; phone?: string; postcode?: string; notes?: string };
  design: { state: Record<string, unknown>; spec: Spec; summary: Record<string, string> };
  site_record: string | null;
  files: { path: string; label: string; kind: string }[];
  suggested_price: Price | null;
  price: Price | null;
  price_note: string | null;
  price_sent_at: string | null;
  change_request: string | null;
  sizes_confirmed_at: string | null;
  extras: ExtraLine[];
  stripe_session_id: string | null;
  amount_paid_pence: number | null;
  paid_at: string | null;
  delivery: Delivery | null;
  ordered_at: string | null;
  customer_token: string;
  admin_token: string;
}

export interface Delivery {
  name?: string;
  phone?: string;
  address?: Record<string, string | null>;
}

export interface SpecPanel {
  id: string;
  label: string;
  kind: 'fixed' | 'door';
  tightWidthMm: number;
  tightHeightMm: number;
  cutWidthMm: number;
  cutHeightMm: number;
  weightKg: number;
  notches: { corner: string; widthMm: number; heightMm: number }[];
  door?: {
    hingeSide: 'left' | 'right';
    swing: string;
    sealType: string;
    hingeBrand: string;
    hingePlacement?: { topHingeOffset?: number; bottomHingeOffset?: number };
  };
}

export interface Spec {
  panels: SpecPanel[];
  cornerCount: number;
  totalRunWidthMm: number;
  totalChannelLengthMm: number;
  heightMm: number;
  mounting: 'channel' | 'clamps';
  glassThicknessMm: number;
  totalGlassWeightKg: number;
  support?: { supportBarRequired?: boolean; supportPanelRequired?: boolean };
  rakeNotes?: string[];
  warnings?: string[];
}

export const customerUrl = (q: Pick<QuoteRow, 'id' | 'customer_token'>) =>
  `${env.siteUrl}/quote/${q.id}?k=${q.customer_token}`;
export const adminUrl = (q: Pick<QuoteRow, 'id' | 'admin_token'>) =>
  `${env.siteUrl}/quote/${q.id}/review?k=${q.admin_token}`;

/** Files from storage as email attachments. Missing files are skipped, not fatal. */
export async function fileAttachments(client: SupabaseClient, q: QuoteRow, kinds?: string[]): Promise<MailAttachment[]> {
  const out: MailAttachment[] = [];
  for (const f of q.files) {
    if (kinds && !kinds.includes(f.kind)) continue;
    const { data } = await client.storage.from('quote-files').download(f.path);
    if (!data) continue;
    const bytes = new Uint8Array(await data.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    out.push({ filename: f.path.split('/').pop()!, content: btoa(binary) });
  }
  return out;
}

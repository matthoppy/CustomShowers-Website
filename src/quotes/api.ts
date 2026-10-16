/**
 * Client for the quote functions. The token from the email link is the only
 * credential; it never leaves the URL and the request body.
 */

import { getTenant } from '@/configurator/tenant';
import type { PriceBreakdown, PriceLine } from '@/configurator/pricing';

export type QuoteStatus =
  | 'submitted'
  | 'priced'
  | 'change_requested'
  | 'sizes_confirmed'
  | 'paid'
  | 'ordered'
  | 'cancelled';

export interface QuotePanel {
  id: string;
  label: string;
  kind: 'fixed' | 'door';
  tightWidthMm: number;
  tightHeightMm: number;
  cutWidthMm: number;
  cutHeightMm: number;
  notches: { corner: string; widthMm: number; heightMm: number }[];
  door?: { hingeSide: 'left' | 'right'; swing: string };
}

export interface ExtraLine {
  id: string;
  name: string;
  qty: number;
  unit_pence: number;
  total_pence: number;
}

export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price_pence: number;
  max_qty: number;
}

export interface QuoteFile {
  path: string;
  label: string;
  kind: 'drawing' | 'photo' | 'record';
  url: string;
}

export interface QuoteView {
  id: string;
  ref: string;
  role: 'admin' | 'customer';
  status: QuoteStatus;
  created_at: string;
  customer: { name: string; email: string; phone?: string; postcode?: string; notes?: string };
  design: {
    state: Record<string, unknown>;
    spec: {
      panels: QuotePanel[];
      warnings?: string[];
      rakeNotes?: string[];
      glassThicknessMm: number;
      heightMm: number;
      mounting: 'channel' | 'clamps';
    };
    summary: Record<string, string>;
  };
  price: PriceBreakdown | null;
  price_note: string | null;
  price_sent_at: string | null;
  change_request: string | null;
  sizes_confirmed_at: string | null;
  extras: ExtraLine[];
  amount_paid_pence: number | null;
  paid_at: string | null;
  delivery: { name?: string; phone?: string; address?: Record<string, string | null> } | null;
  files: QuoteFile[];
  catalog: CatalogItem[];
  vat_rate: number;
  // Admin only.
  site_record?: string | null;
  suggested_price?: PriceBreakdown | null;
  ordered_at?: string | null;
  supplier_text?: string;
  customer_url?: string;
  emailed?: boolean;
}

export class QuoteError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const base = getTenant().quotesApi;
  if (!base) throw new QuoteError('Quotes aren’t available here.', 0);
  let res: Response;
  try {
    res = await fetch(`${base}/quote-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new QuoteError('We couldn’t reach our server. Check your connection and try again.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new QuoteError(data.error ?? `Something went wrong (${res.status})`, res.status);
  return data as T;
}

export const quoteApi = {
  get: (id: string, token: string) => call<QuoteView>({ id, token, action: 'get' }),
  savePrice: (id: string, token: string, lines: PriceLine[], note: string) =>
    call<QuoteView>({ id, token, action: 'save_price', price: { lines }, note }),
  sendPrice: (id: string, token: string, lines: PriceLine[], note: string) =>
    call<QuoteView>({ id, token, action: 'send_price', price: { lines }, note }),
  markOrdered: (id: string, token: string) => call<QuoteView>({ id, token, action: 'mark_ordered' }),
  cancel: (id: string, token: string) => call<QuoteView>({ id, token, action: 'cancel' }),
  requestChange: (id: string, token: string, message: string) =>
    call<QuoteView>({ id, token, action: 'request_change', message }),
  confirmSizes: (id: string, token: string) => call<QuoteView>({ id, token, action: 'confirm_sizes', confirmed: true }),
  setExtras: (id: string, token: string, items: { id: string; qty: number }[]) =>
    call<QuoteView>({ id, token, action: 'set_extras', items }),
  checkout: (id: string, token: string, items: { id: string; qty: number }[]) =>
    call<{ url: string; total_pence: number }>({ id, token, action: 'checkout', items }),
};

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  submitted: 'Waiting for price',
  priced: 'Price sent',
  change_requested: 'Change requested',
  sizes_confirmed: 'Sizes confirmed',
  paid: 'Paid',
  ordered: 'Glass ordered',
  cancelled: 'Cancelled',
};

/**
 * The admin's view of a quote: check the design, set the price and send it,
 * then, once paid, the supplier order ready to forward. Reached from the
 * link in the "new design" email; the ?k= admin token is the key.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatPence, totalsFor, type PriceLine } from '@/configurator/pricing';
import { quoteApi, QuoteError, type QuoteView } from '@/quotes/api';
import {
  Card,
  FileGallery,
  FullMessage,
  PriceSummary,
  QuoteShell,
  SizesTable,
  StatusChip,
  useQuoteParams,
} from '@/quotes/components';

/** Price lines as the editor holds them: pounds as typed, not pence. */
interface DraftLine {
  description: string;
  qty: string;
  unit: string;
  category: string;
}

const toDraft = (lines: PriceLine[]): DraftLine[] =>
  lines.map((l) => ({ description: l.description, qty: String(l.qty), unit: (l.unit_pence / 100).toFixed(2), category: l.category }));

const fromDraft = (lines: DraftLine[]): PriceLine[] =>
  lines.map((l) => {
    const qty = Math.round(Number(l.qty));
    const unit = Math.round(Number(l.unit) * 100);
    return {
      description: l.description.trim(),
      qty,
      unit_pence: unit,
      total_pence: qty * unit,
      category: (l.category || 'other') as PriceLine['category'],
    };
  });

const draftValid = (lines: DraftLine[]) =>
  lines.length > 0 &&
  lines.every((l) => l.description.trim() && Number(l.qty) >= 1 && Number.isFinite(Number(l.unit)) && l.unit.trim() !== '');

const EDITABLE = ['submitted', 'change_requested', 'priced'];

export default function QuoteReviewPage() {
  const { id = '' } = useParams();
  const { token } = useQuoteParams();
  const [q, setQ] = useState<QuoteView | null>(null);
  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const adopt = useCallback((next: QuoteView) => {
    setQ(next);
    setDraft(toDraft((next.price ?? next.suggested_price)?.lines ?? []));
    setNote(next.price_note ?? '');
  }, []);

  useEffect(() => {
    quoteApi
      .get(id, token)
      .then((next) => {
        if (next.role !== 'admin') setNotFound(true);
        else adopt(next);
      })
      .catch((e) => {
        if (e instanceof QuoteError && e.status === 404) setNotFound(true);
        else setError(e instanceof Error ? e.message : 'Something went wrong.');
      });
  }, [id, token, adopt]);

  const preview = useMemo(
    () => (draftValid(draft) ? totalsFor(fromDraft(draft), q?.vat_rate ?? 0.2) : null),
    [draft, q?.vat_rate]
  );

  const act = async (fn: () => Promise<QuoteView>, message?: string) => {
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const next = await fn();
      adopt(next);
      if (message) setFlash(next.emailed === false ? `${message} — but the email didn’t send. Check RESEND_API_KEY.` : message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Couldn’t copy — select the text and copy it instead.');
    }
  };

  if (notFound || !token) {
    return (
      <QuoteShell title="Review">
        <FullMessage title="Quote not found">Use the link from the new design email.</FullMessage>
      </QuoteShell>
    );
  }
  if (!q) {
    return (
      <QuoteShell title="Review">
        {error ? (
          <FullMessage title="Something went wrong">{error}</FullMessage>
        ) : (
          <div className="flex justify-center py-24 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="Loading" />
          </div>
        )}
      </QuoteShell>
    );
  }

  const c = q.customer;
  const editable = EDITABLE.includes(q.status);
  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setDraft((d) => d.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <QuoteShell title={`Review ${q.ref}`}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{q.ref}</h1>
          <StatusChip status={q.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          Received {new Date(q.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {flash && (
        <div role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          {flash}
        </div>
      )}

      <Card title="Customer">
        <p className="font-medium">{c.name}</p>
        <p className="text-sm">
          <a className="underline" href={`mailto:${c.email}`}>
            {c.email}
          </a>
          {c.phone && (
            <>
              {' · '}
              <a className="underline" href={`tel:${c.phone}`}>
                {c.phone}
              </a>
            </>
          )}
          {c.postcode && ` · ${c.postcode}`}
        </p>
        {c.notes && <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{c.notes}</p>}
      </Card>

      {q.change_request && q.status === 'change_requested' && (
        <Card title="Customer asked for a change" className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <p className="whitespace-pre-wrap text-sm">{q.change_request}</p>
        </Card>
      )}

      {(q.status === 'paid' || q.status === 'ordered') && (
        <Card title="Paid — order the glass" className="border-emerald-300">
          <p className="text-sm">
            Paid <strong>{formatPence(q.amount_paid_pence ?? 0)}</strong>
            {q.paid_at && ` on ${new Date(q.paid_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}`}.
          </p>
          {q.delivery?.address && (
            <p className="mt-2 text-sm">
              Deliver to:{' '}
              {[q.delivery.name, q.delivery.address.line1, q.delivery.address.line2, q.delivery.address.city, q.delivery.address.postal_code]
                .filter(Boolean)
                .join(', ')}
              {q.delivery.phone && ` · ${q.delivery.phone}`}
            </p>
          )}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">For the glass supplier</h3>
              <Button size="sm" variant="outline" className="min-h-11" onClick={() => copy(q.supplier_text ?? '', 'supplier')}>
                {copied === 'supplier' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied === 'supplier' ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border bg-muted p-3 font-mono text-xs">{q.supplier_text}</pre>
          </div>
          {q.extras.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-1 font-medium">Extras to send</h3>
              <ul className="list-disc pl-5 text-sm">
                {q.extras.map((e) => (
                  <li key={e.id}>
                    {e.name} × {e.qty}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {q.status === 'paid' ? (
            <Button onClick={() => act(() => quoteApi.markOrdered(id, token), 'Marked as ordered')} disabled={busy} className="mt-4 min-h-11">
              Mark glass as ordered
            </Button>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Ordered {q.ordered_at && new Date(q.ordered_at).toLocaleDateString('en-GB', { dateStyle: 'medium' })}.
            </p>
          )}
        </Card>
      )}

      <Card title="Design">
        <FileGallery files={q.files} />
        <div className="mt-4">
          <SizesTable q={q} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {Object.entries(q.design.summary ?? {}).map(([k, v]) => (
            <div key={k}>
              <dt className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, ' $1').replace(/mm$/i, '')}</dt>
              <dd className="font-medium">{String(v)}</dd>
            </div>
          ))}
        </dl>
        {!!q.design.spec.warnings?.length && (
          <ul className="mt-4 list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-8 text-sm text-amber-900">
            {q.design.spec.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
        {q.site_record && (
          <details className="mt-4 rounded-md border">
            <summary className="cursor-pointer p-3 text-sm font-medium">Customer’s site readings</summary>
            <pre className="overflow-x-auto whitespace-pre-wrap border-t p-3 font-mono text-xs">{q.site_record}</pre>
          </details>
        )}
      </Card>

      <Card title={editable ? 'Price' : 'Price sent'}>
        {editable ? (
          <>
            <div className="space-y-3">
              {draft.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_auto] gap-2 rounded-md border p-3 sm:grid-cols-[1fr_4.5rem_7rem_auto] sm:items-center sm:border-0 sm:p-0">
                  <Input
                    aria-label="Description"
                    value={l.description}
                    onChange={(e) => setLine(i, { description: e.target.value })}
                    className="col-span-2 min-h-11 sm:col-span-1"
                  />
                  <Input
                    aria-label="Quantity"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={l.qty}
                    onChange={(e) => setLine(i, { qty: e.target.value })}
                    className="min-h-11"
                  />
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">£</span>
                    <Input
                      aria-label="Unit price, pounds, ex VAT"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      value={l.unit}
                      onChange={(e) => setLine(i, { unit: e.target.value })}
                      className="min-h-11 pl-7"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 justify-self-end"
                    aria-label="Remove line"
                    onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                onClick={() => setDraft((d) => [...d, { description: '', qty: '1', unit: '', category: 'other' }])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add line
              </Button>
              {q.suggested_price && (
                <Button variant="ghost" size="sm" className="min-h-11" onClick={() => setDraft(toDraft(q.suggested_price!.lines))}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Back to suggested
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Unit prices are ex VAT. VAT is added to the total.</p>

            <div className="mt-6 space-y-1 border-t pt-4 text-sm">
              {preview ? (
                <>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPence(preview.subtotal_pence)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT ({Math.round(preview.vat_rate * 100)}%)</span>
                    <span className="font-mono">{formatPence(preview.vat_pence)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold">
                    <span>Customer pays</span>
                    <span className="font-mono">{formatPence(preview.total_pence)}</span>
                  </div>
                </>
              ) : (
                <p className="text-destructive">Every line needs a description, a quantity and a price.</p>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <label htmlFor="note" className="text-sm font-medium">
                Note to the customer (optional)
              </label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Delivery is usually 7–10 working days after you order."
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => act(() => quoteApi.sendPrice(id, token, fromDraft(draft), note), `Price sent to ${c.email}`)}
                disabled={busy || !preview}
                className="min-h-11"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {q.status === 'priced' ? 'Update and send again' : 'Send price to customer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => act(() => quoteApi.savePrice(id, token, fromDraft(draft), note), 'Saved')}
                disabled={busy || !preview}
                className="min-h-11"
              >
                Save without sending
              </Button>
            </div>
          </>
        ) : (
          <PriceSummary q={q} />
        )}

        {q.customer_url && q.status !== 'submitted' && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
            <span className="text-muted-foreground">Customer’s link:</span>
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => copy(q.customer_url!, 'link')}>
              {copied === 'link' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </Button>
          </div>
        )}
      </Card>

      {['submitted', 'priced', 'change_requested', 'sizes_confirmed'].includes(q.status) && (
        <div className="text-right">
          <Button
            variant="ghost"
            className="min-h-11 text-destructive"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Cancel ${q.ref}? The customer won’t be able to pay for it.`)) {
                act(() => quoteApi.cancel(id, token), 'Quote cancelled');
              }
            }}
          >
            Cancel this quote
          </Button>
        </div>
      )}
    </QuoteShell>
  );
}

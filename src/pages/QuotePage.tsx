/**
 * The customer's quote: see the price, check the sizes, add extras, pay.
 * Reached from the link in the price email; the ?k= token is the key.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { formatPence } from '@/configurator/pricing';
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

const STEPS = ['Your price', 'Check sizes', 'Extras & payment'];

export default function QuotePage() {
  const { id = '' } = useParams();
  const { token, paid } = useQuoteParams();
  const [q, setQ] = useState<QuoteView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setQ(await quoteApi.get(id, token));
    } catch (e) {
      if (e instanceof QuoteError && e.status === 404) setNotFound(true);
      else setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  // Back from Stripe before the webhook has landed: check again for a little while.
  useEffect(() => {
    if (!paid || !q || q.status !== 'sizes_confirmed') return;
    let tries = 0;
    const timer = window.setInterval(async () => {
      tries++;
      try {
        const next = await quoteApi.get(id, token);
        setQ(next);
        if (next.status !== 'sizes_confirmed' || tries >= 12) window.clearInterval(timer);
      } catch {
        window.clearInterval(timer);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paid, q, id, token]);

  const run = async (fn: () => Promise<QuoteView>) => {
    setBusy(true);
    setError(null);
    try {
      setQ(await fn());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (notFound || !token) {
    return (
      <QuoteShell title="Quote">
        <FullMessage title="We can’t find that quote">
          Please use the link in your email, or reply to it and we’ll help.
        </FullMessage>
      </QuoteShell>
    );
  }

  if (!q) {
    return (
      <QuoteShell title="Quote">
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

  const stepIndex = q.status === 'priced' ? 1 : q.status === 'sizes_confirmed' ? 2 : -1;

  return (
    <QuoteShell title={`Quote ${q.ref}`}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">Your shower glass</h1>
          <StatusChip status={q.status} />
        </div>
        <p className="text-sm text-muted-foreground">Reference {q.ref}</p>
      </header>

      {stepIndex >= 0 && (
        <ol className="flex gap-2 text-sm" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`flex-1 rounded-md border px-3 py-2 ${
                i === stepIndex ? 'border-primary bg-primary/5 font-semibold' : i < stepIndex ? 'text-muted-foreground' : 'text-muted-foreground/70'
              }`}
              aria-current={i === stepIndex ? 'step' : undefined}
            >
              <span className="block text-xs">{i < stepIndex ? '✓' : `Step ${i + 1}`}</span>
              <span className="hidden sm:inline">{s}</span>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {q.status === 'submitted' && (
        <FullMessage title="We’re preparing your price">
          We’ll email you as soon as it’s ready, usually within one working day.
        </FullMessage>
      )}

      {q.status === 'change_requested' && (
        <Card title="We’ve got your message">
          <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{q.change_request}</p>
          <p className="mt-3 text-sm text-muted-foreground">We’ll be in touch, and send an updated price if anything changes.</p>
        </Card>
      )}

      {q.status === 'cancelled' && <FullMessage title="This quote has been cancelled">Reply to our email if that’s a surprise.</FullMessage>}

      {q.status === 'priced' && <PricedStep q={q} busy={busy} run={run} id={id} token={token} />}

      {q.status === 'sizes_confirmed' && (
        <ExtrasStep q={q} busy={busy} setBusy={setBusy} setError={setError} run={run} id={id} token={token} paidReturn={paid} />
      )}

      {(q.status === 'paid' || q.status === 'ordered') && <PaidView q={q} />}
    </QuoteShell>
  );
}

// -----------------------------------------------------------------------------

interface StepProps {
  q: QuoteView;
  busy: boolean;
  run: (fn: () => Promise<QuoteView>) => Promise<void>;
  id: string;
  token: string;
}

function ChangeRequest({ busy, run, id, token }: Omit<StepProps, 'q'>) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  if (!open) {
    return (
      <Button variant="link" className="h-auto min-h-11 px-0" onClick={() => setOpen(true)}>
        Something’s not right? Tell us
      </Button>
    );
  }
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <label htmlFor="change" className="text-sm font-medium">
        What needs changing?
      </label>
      <Textarea
        id="change"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="e.g. The opening is actually 905mm at the top, and I’d like the hinges on the left."
      />
      <div className="flex gap-3">
        <Button
          onClick={() => run(() => quoteApi.requestChange(id, token, message))}
          disabled={busy || !message.trim()}
          className="min-h-11"
        >
          Send to Custom Showers
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="min-h-11">
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PricedStep({ q, busy, run, id, token }: StepProps) {
  const [checked, setChecked] = useState(false);
  const summary = q.design.summary ?? {};
  return (
    <>
      <Card title="Your price">
        {q.price_note && <p className="mb-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{q.price_note}</p>}
        <PriceSummary q={q} extras={[]} />
      </Card>

      <Card title="Check your sizes">
        <p className="mb-4 text-sm text-muted-foreground">
          Glass is made to measure and can’t be cut down once it’s toughened, so please check these against your
          bathroom before you go on.
        </p>
        <FileGallery files={q.files} />
        <div className="mt-4">
          <SizesTable q={q} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {[
            ['Glass', summary.glass],
            ['Glass type', summary.glassType],
            ['Finish', summary.finish],
            ['Handle', summary.handle],
            ['Fixing', summary.mounting],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
        </dl>
      </Card>

      <Card>
        <label className="flex cursor-pointer items-start gap-3">
          <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <span className="text-sm">
            I’ve checked these sizes and they’re right. I understand the glass is made to these sizes and can’t be
            changed once it’s cut.
          </span>
        </label>
        <Button
          onClick={() => run(() => quoteApi.confirmSizes(id, token))}
          disabled={!checked || busy}
          className="mt-4 min-h-11 w-full sm:w-auto"
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm sizes
        </Button>
        <div className="mt-2">
          <ChangeRequest busy={busy} run={run} id={id} token={token} />
        </div>
      </Card>
    </>
  );
}

function ExtrasStep({
  q,
  busy,
  setBusy,
  setError,
  run,
  id,
  token,
  paidReturn,
}: StepProps & { setBusy: (b: boolean) => void; setError: (e: string | null) => void; paidReturn: boolean }) {
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(q.extras.map((e) => [e.id, e.qty]))
  );

  const lines = useMemo(
    () =>
      q.catalog
        .filter((c) => (qty[c.id] ?? 0) > 0)
        .map((c) => ({ id: c.id, name: c.name, qty: qty[c.id], unit_pence: c.price_pence, total_pence: c.price_pence * qty[c.id] })),
    [q.catalog, qty]
  );
  const total = (q.price?.total_pence ?? 0) + lines.reduce((s, l) => s + l.total_pence, 0);

  const change = (itemId: string, delta: number, max: number) =>
    setQty((cur) => ({ ...cur, [itemId]: Math.max(0, Math.min(max, (cur[itemId] ?? 0) + delta)) }));

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = await quoteApi.checkout(id, token, lines.map((l) => ({ id: l.id, qty: l.qty })));
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  };

  if (paidReturn) {
    return (
      <FullMessage title="Payment received">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your order…
        </span>
      </FullMessage>
    );
  }

  return (
    <>
      <Card title="Anything else you need?">
        <p className="mb-4 text-sm text-muted-foreground">
          Sizes confirmed. Add anything you need for fitting and we’ll send it with your glass.
        </p>
        <ul className="divide-y">
          {q.catalog.map((c) => {
            const n = qty[c.id] ?? 0;
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                  <p className="text-sm font-medium">{formatPence(c.price_pence)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => change(c.id, -1, c.max_qty)}
                    disabled={n === 0}
                    aria-label={`Fewer ${c.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono" aria-live="polite">
                    {n}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => change(c.id, 1, c.max_qty)}
                    disabled={n >= c.max_qty}
                    aria-label={`More ${c.name}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Your order">
        <PriceSummary q={q} extras={lines} />
        <Button onClick={pay} disabled={busy} className="mt-6 min-h-12 w-full text-base">
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay {formatPence(total)} securely
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Card payment by Stripe. You’ll enter your delivery address on the next page.
        </p>
        <div className="mt-2">
          <ChangeRequest busy={busy} run={run} id={id} token={token} />
        </div>
      </Card>
    </>
  );
}

function PaidView({ q }: { q: QuoteView }) {
  const a = q.delivery?.address;
  return (
    <>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold">
              {q.status === 'ordered' ? 'Your glass is on order' : 'Thank you — your order is confirmed'}
            </h2>
            <p className="mt-1 text-sm">
              {q.amount_paid_pence ? `We’ve received ${formatPence(q.amount_paid_pence)}. ` : ''}
              We’ll be in touch with a delivery date.
            </p>
          </div>
        </div>
      </div>
      <Card title="Your order">
        <PriceSummary q={q} />
      </Card>
      {a && (
        <Card title="Delivering to">
          <p className="text-sm">
            {[q.delivery?.name, a.line1, a.line2, a.city, a.postal_code].filter(Boolean).join(', ')}
          </p>
        </Card>
      )}
      <Card title="Sizes">
        <SizesTable q={q} />
      </Card>
    </>
  );
}

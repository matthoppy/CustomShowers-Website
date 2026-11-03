/**
 * The quote-form enquiries: the "Get a free quote" form on the home page,
 * with the message, the address, where the visitor came from, and any photo
 * or sketch they attached.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdmin } from '../auth';
import { QUOTE_STATUSES, type Quote, type QuoteStatus, type QuotesList } from '../api/types';
import { Empty, ErrorNote, Loading, PageHeader, QUOTE_STATUS_LABEL, StatusBadge, formatDateTime, timeAgo } from '../ui';
import { FilterChip } from './Jobs';

export function Quotes() {
  const { api } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as QuoteStatus | null) || null;
  const [q, setQ] = useState('');
  const [list, setList] = useState<QuotesList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(params.get('open'));

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api
        .listQuotes({ status, q })
        .then((r) => live && setList(r))
        .catch((e: Error) => live && setError(e.message));
    }, 150);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [api, status, q]);

  const setStatus = (s: QuoteStatus | null) => {
    const next = new URLSearchParams(params);
    if (s) next.set('status', s);
    else next.delete('status');
    next.delete('open');
    setParams(next, { replace: true });
  };

  const replace = (quote: Quote) => setList((l) => (l ? { ...l, quotes: l.quotes.map((x) => (x.id === quote.id ? quote : x)) } : l));
  const total = list ? Object.values(list.counts).reduce((a, b) => a + (b || 0), 0) : 0;

  return (
    <div>
      <PageHeader title="Quote forms" blurb="Enquiries from the quote form on the home page. The CRM portal keeps its own copy of the contact." />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <FilterChip active={status === null} onClick={() => setStatus(null)} label="All" count={total} />
          {QUOTE_STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} label={QUOTE_STATUS_LABEL[s]} count={list?.counts[s] || 0} />
          ))}
        </div>
        <Input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, address, message" className="ml-auto h-9 w-full sm:w-72" aria-label="Search enquiries" />
      </div>

      {error ? (
        <ErrorNote message={error} />
      ) : !list ? (
        <Loading what="Loading enquiries" />
      ) : list.quotes.length === 0 ? (
        <Empty title={q || status ? 'No enquiries match' : 'No enquiries yet'} blurb={q || status ? 'Try another status or search.' : 'Quote-form enquiries appear here once the contact worker has its database binding.'} />
      ) : (
        <ul className="divide-y rounded-lg border">
          {list.quotes.map((quote) => (
            <QuoteRow key={quote.id} quote={quote} open={open === quote.id} onToggle={() => setOpen(open === quote.id ? null : quote.id)} onChange={replace} />
          ))}
        </ul>
      )}
    </div>
  );
}

function QuoteRow({ quote, open, onToggle, onChange }: { quote: Quote; open: boolean; onToggle: () => void; onChange: (q: Quote) => void }) {
  const { api } = useAdmin();
  const [notes, setNotes] = useState(quote.notes || '');
  const [saving, setSaving] = useState(false);
  const utm = Object.entries(quote.utm || {}).filter(([, v]) => v);

  const update = async (patch: { status?: QuoteStatus; notes?: string }) => {
    setSaving(true);
    try {
      onChange(await api.updateQuote(quote.id, patch));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li>
      <button type="button" onClick={onToggle} aria-expanded={open} className="grid w-full gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{quote.name || 'Unnamed'}</span>
            <StatusBadge status={quote.status} />
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {quote.serviceType || 'Location not given'}
            {quote.address ? ` · ${quote.address}` : ''}
          </div>
        </div>
        <div className="truncate text-sm text-muted-foreground">{quote.message || 'No message'}</div>
        <div className="text-xs text-muted-foreground sm:text-right" title={formatDateTime(quote.createdAt)}>
          {timeAgo(quote.createdAt)}
        </div>
      </button>
      {open && (
        <div className="grid gap-4 border-t bg-muted/20 px-4 py-4 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-3 text-sm">
            {quote.message && <p className="whitespace-pre-wrap">{quote.message}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {quote.email && (
                <a href={`mailto:${quote.email}?subject=${encodeURIComponent('Your shower enquiry')}`} className="flex items-center gap-1 underline-offset-2 hover:underline">
                  <Mail className="h-3 w-3" /> {quote.email}
                </a>
              )}
              {quote.phone && (
                <a href={`tel:${quote.phone.replace(/\s+/g, '')}`} className="flex items-center gap-1 underline-offset-2 hover:underline">
                  <Phone className="h-3 w-3" /> {quote.phone}
                </a>
              )}
              {quote.photo && (
                <a href={api.quoteFileUrl(quote.id, quote.photo.filename)} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline-offset-2 hover:underline">
                  <ExternalLink className="h-3 w-3" /> {quote.photo.filename}
                </a>
              )}
            </div>
            {quote.photo && (
              <a href={api.quoteFileUrl(quote.id, quote.photo.filename)} target="_blank" rel="noreferrer" className="block w-fit overflow-hidden rounded border">
                <img src={api.quoteFileUrl(quote.id, quote.photo.filename)} alt="Attached by the customer" className="max-h-48 object-cover" loading="lazy" />
              </a>
            )}
            {utm.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Came from {utm.map(([k, v]) => `${k} ${v}`).join(' · ')}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {quote.id} · {formatDateTime(quote.createdAt)} · {quote.emailed ? 'emailed to the workshop' : 'not emailed'}
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-xs">
              <span className="text-muted-foreground">Status</span>
              <select value={quote.status} disabled={saving} onChange={(e) => update({ status: e.target.value as QuoteStatus })} className="mt-1 h-9 w-full rounded border bg-background px-2 text-sm">
                {QUOTE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {QUOTE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">Notes</span>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== (quote.notes || '') && update({ notes })} rows={3} className="mt-1 text-sm" />
            </label>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Pieces shared by the customer quote page and the admin review page.
 */

import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { formatPence } from '@/configurator/pricing';
import { STATUS_LABELS, type ExtraLine, type QuoteFile, type QuoteStatus, type QuoteView } from './api';

/** Quote links carry a private token, so keep these pages out of search engines. */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}

export function QuoteShell({ title, children }: { title: string; children: React.ReactNode }) {
  useNoIndex();
  useEffect(() => {
    document.title = `${title} · Custom Showers`;
  }, [title]);
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />
      <main className="flex-1 pt-28">
        <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

const STATUS_STYLES: Record<QuoteStatus, string> = {
  submitted: 'bg-slate-100 text-slate-800',
  priced: 'bg-blue-100 text-blue-800',
  change_requested: 'bg-amber-100 text-amber-900',
  sizes_confirmed: 'bg-indigo-100 text-indigo-800',
  paid: 'bg-emerald-100 text-emerald-800',
  ordered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function StatusChip({ status }: { status: QuoteStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border bg-card p-4 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function PriceSummary({ q, extras }: { q: QuoteView; extras?: ExtraLine[] }) {
  if (!q.price) return null;
  const extraLines = extras ?? q.extras;
  const extrasTotal = extraLines.reduce((s, e) => s + e.total_pence, 0);
  return (
    <div className="space-y-1 text-sm">
      {q.price.lines.map((l, i) => (
        <div key={i} className="flex justify-between gap-4 py-1">
          <span>
            {l.description}
            {l.qty > 1 && <span className="text-muted-foreground"> × {l.qty}</span>}
          </span>
          <span className="whitespace-nowrap font-mono">{formatPence(l.total_pence)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-4 border-t py-1 text-muted-foreground">
        <span>VAT ({Math.round(q.price.vat_rate * 100)}%)</span>
        <span className="font-mono">{formatPence(q.price.vat_pence)}</span>
      </div>
      {extraLines.length > 0 && (
        <>
          <div className="pt-2 font-medium">Extras (inc VAT)</div>
          {extraLines.map((e) => (
            <div key={e.id} className="flex justify-between gap-4 py-1">
              <span>
                {e.name} <span className="text-muted-foreground">× {e.qty}</span>
              </span>
              <span className="font-mono">{formatPence(e.total_pence)}</span>
            </div>
          ))}
        </>
      )}
      <div className="flex justify-between gap-4 border-t pt-2 text-base font-bold">
        <span>Total</span>
        <span className="font-mono">{formatPence(q.price.total_pence + extrasTotal)}</span>
      </div>
    </div>
  );
}

export function SizesTable({ q }: { q: QuoteView }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="py-2 pr-2 font-medium">Panel</th>
            <th className="py-2 pr-2 text-right font-medium">Your measurement</th>
            <th className="py-2 text-right font-medium">Glass size</th>
          </tr>
        </thead>
        <tbody>
          {q.design.spec.panels.map((p) => (
            <tr key={p.id} className="border-b last:border-0">
              <td className="py-2 pr-2">
                {p.label}
                {p.door && (
                  <span className="block text-xs text-muted-foreground">Hinges on the {p.door.hingeSide}</span>
                )}
                {p.notches.map((n, i) => (
                  <span key={i} className="block text-xs text-muted-foreground">
                    Notch {n.corner.toLowerCase()} {n.widthMm}×{n.heightMm}mm
                  </span>
                ))}
              </td>
              <td className="whitespace-nowrap py-2 pr-2 text-right font-mono">
                {p.tightWidthMm} × {p.tightHeightMm}
              </td>
              <td className="whitespace-nowrap py-2 text-right font-mono">
                {p.cutWidthMm} × {p.cutHeightMm}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted-foreground">
        Sizes in millimetres, width × height. The glass is a little smaller than your opening to leave room for the
        channel, seals and hinges.
      </p>
    </div>
  );
}

export function FileGallery({ files }: { files: QuoteFile[] }) {
  const images = files.filter((f) => f.kind !== 'record');
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((f) => (
        <a
          key={f.path}
          href={f.url}
          target="_blank"
          rel="noreferrer"
          className="group overflow-hidden rounded-lg border bg-white"
        >
          <img src={f.url} alt={f.label} className="aspect-[4/3] w-full object-contain p-1" loading="lazy" />
          <span className="block truncate border-t px-2 py-1 text-xs text-muted-foreground group-hover:text-foreground">
            {f.label.replace(/\.(png|jpe?g)$/i, '').replace(/[-_]/g, ' ')}
          </span>
        </a>
      ))}
    </div>
  );
}

export function useQuoteParams(): { token: string; paid: boolean } {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  return { token: params.get('k') ?? '', paid: params.get('paid') === '1' };
}

export function FullMessage({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-8 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      {children && <div className="mt-2 text-muted-foreground">{children}</div>}
    </div>
  );
}

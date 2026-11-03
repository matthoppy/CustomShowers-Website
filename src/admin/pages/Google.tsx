/**
 * The Google Business Profile: how often the listing is seen and acted on,
 * and the latest reviews. Connected once with a Google sign-in on the worker;
 * the refresh token stays there.
 */

import { useEffect, useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '../auth';
import type { GoogleStatus, GoogleSummary } from '../api/types';
import { DailyChart } from '../charts';
import { ErrorNote, Loading, PageHeader, Stat, formatDate, formatNumber } from '../ui';
import { FilterChip } from './Jobs';

const RANGES = [7, 28, 90];

export function Google() {
  const { api } = useAdmin();
  const [status, setStatus] = useState<GoogleStatus | null>(null);
  const [days, setDays] = useState(28);
  const [data, setData] = useState<GoogleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const callbackError = hash.get('error');

  useEffect(() => {
    api.googleStatus().then(setStatus).catch((e: Error) => setError(e.message));
  }, [api]);

  useEffect(() => {
    if (!status?.connected) return;
    let live = true;
    setData(null);
    api
      .googleSummary(days)
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [api, status, days]);

  const connect = async () => {
    setConnecting(true);
    try {
      window.location.href = await api.googleConnectUrl();
    } catch (e) {
      setError((e as Error).message);
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    await api.googleDisconnect();
    setStatus((s) => (s ? { ...s, connected: false, location: null } : s));
    setData(null);
  };

  if (error) return <ErrorNote message={error} />;
  if (!status) return <Loading what="Checking Google" />;

  if (!status.configured) {
    return (
      <div>
        <PageHeader title="Google profile" />
        <div className="rounded-lg border border-dashed p-6 text-sm">
          <div className="font-semibold">Google is not set up on the worker yet</div>
          <p className="mt-1 text-muted-foreground">
            This needs a Google Cloud project with the Business Profile APIs enabled and an OAuth client whose redirect URI is{' '}
            <code className="rounded bg-muted px-1">{status.redirectUri}</code>. Set its id and secret on the admin worker as{' '}
            <code className="rounded bg-muted px-1">GOOGLE_CLIENT_ID</code> and <code className="rounded bg-muted px-1">GOOGLE_CLIENT_SECRET</code>. Google also has to approve the account for the
            Business Profile API. The steps are in docs/ADMIN_DASHBOARD.md.
          </p>
        </div>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div>
        <PageHeader title="Google profile" />
        {callbackError && <div className="mb-4"><ErrorNote message={`Google did not connect (${callbackError}). Try again.`} /></div>}
        <div className="rounded-lg border p-6 text-sm">
          <div className="font-semibold">Connect your Google Business Profile</div>
          <p className="mt-1 text-muted-foreground">Sign in with the Google account that manages the Custom Showers listing. The dashboard then shows how often the listing is seen, calls and website clicks from it, and the latest reviews.</p>
          <Button className="mt-4" onClick={connect} disabled={connecting}>
            {connecting ? 'Opening Google…' : 'Connect Google'}
          </Button>
        </div>
      </div>
    );
  }

  const m = data?.metrics;
  const r = data?.reviews;

  return (
    <div>
      <PageHeader
        title="Google profile"
        blurb={
          status.location ? (
            <>
              {status.location.title}
              {status.location.address ? `, ${status.location.address}` : ''}.{' '}
              {status.location.mapsUri && (
                <a href={status.location.mapsUri} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Open on Google Maps
                </a>
              )}
            </>
          ) : (
            'Connected.'
          )
        }
        actions={
          <div className="flex gap-1">
            {RANGES.map((x) => (
              <FilterChip key={x} active={days === x} onClick={() => setDays(x)} label={`${x} days`} />
            ))}
          </div>
        }
      />

      {!data ? (
        <Loading what="Asking Google" />
      ) : (
        <div className="space-y-8">
          {m ? (
            <section>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Listing views" value={formatNumber(m.totals.impressions)} hint={`Search and Maps, last ${m.days} days`} />
                <Stat label="Website clicks" value={formatNumber(m.totals.websiteClicks)} />
                <Stat label="Calls" value={formatNumber(m.totals.calls)} />
                <Stat label="Direction requests" value={formatNumber(m.totals.directions)} />
              </div>
              <div className="mt-4 rounded-lg border p-4">
                <DailyChart data={m.daily} dataKey="impressions" label="Listing views" kind="bar" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Google reports these about two days behind.</p>
            </section>
          ) : (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{data.errors?.metrics || 'No performance data yet.'}</p>
          )}

          <section>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Reviews
                {r && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    {r.averageRating ?? '–'} average over {r.total}
                  </span>
                )}
              </h2>
              {status.location?.newReviewUri && (
                <button type="button" className="text-xs underline underline-offset-2" onClick={() => navigator.clipboard?.writeText(status.location!.newReviewUri!)}>
                  Copy the "leave a review" link
                </button>
              )}
            </div>
            {r && r.items.length > 0 ? (
              <ul className="divide-y rounded-lg border">
                {r.items.map((rev) => (
                  <li key={rev.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rev.name}</span>
                        <Stars n={rev.rating} />
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(rev.at)}</span>
                    </div>
                    {rev.comment && <p className="mt-1 text-sm text-muted-foreground">{rev.comment}</p>}
                    <div className="mt-1 text-xs">
                      {rev.replied ? (
                        <span className="text-muted-foreground">Replied</span>
                      ) : (
                        <a href={status.location?.mapsUri || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
                          Reply on Google <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{data.errors?.reviews || 'No reviews yet.'}</p>
            )}
          </section>

          <p className="text-xs text-muted-foreground">
            <button type="button" className="underline underline-offset-2" onClick={disconnect}>
              Disconnect Google
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

function Stars({ n }: { n: number | null }) {
  if (!n) return null;
  return (
    <span className="flex items-center" aria-label={`${n} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
      ))}
    </span>
  );
}

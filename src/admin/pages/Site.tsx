/**
 * How the site is doing on Cloudflare: visitors and requests for
 * customshowers.uk, the workers' request counts, and the latest Pages
 * deployments, which is also where a published picture change turns up.
 */

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAdmin } from '../auth';
import type { CloudflareSummary } from '../api/types';
import { DailyChart } from '../charts';
import { ErrorNote, Loading, PageHeader, Stat, StatusBadge, formatBytes, formatDateTime, formatNumber, timeAgo } from '../ui';
import { FilterChip } from './Jobs';

const RANGES = [7, 30, 90];

export function Site() {
  const { api, user } = useAdmin();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<CloudflareSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setData(null);
    api
      .cloudflare(days)
      .then((d) => live && setData(d))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [api, days]);

  const site = user?.siteOrigin || 'https://customshowers.uk';

  return (
    <div>
      <PageHeader
        title="Site"
        blurb={
          <>
            Traffic and deployments for{' '}
            <a href={site} target="_blank" rel="noreferrer" className="underline underline-offset-2">
              {site.replace(/^https?:\/\//, '')}
            </a>
            , from Cloudflare.
          </>
        }
        actions={
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <FilterChip key={r} active={days === r} onClick={() => setDays(r)} label={`${r} days`} />
            ))}
          </div>
        }
      />

      {error ? (
        <ErrorNote message={error} retry={() => setDays((d) => d)} />
      ) : !data ? (
        <Loading what="Asking Cloudflare" />
      ) : !data.configured.token ? (
        <NotConfigured />
      ) : (
        <div className="space-y-8">
          <section>
            {data.configured.zone ? (
              <>
                {data.totals && (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat label="Visitors" value={formatNumber(data.totals.visitors)} hint={`unique, last ${days} days`} />
                    <Stat label="Page views" value={formatNumber(data.totals.pageViews)} />
                    <Stat label="Requests" value={formatNumber(data.totals.requests)} hint={formatBytes(data.totals.bytes) + ' served'} />
                    <Stat label="Threats blocked" value={formatNumber(data.totals.threats)} />
                  </div>
                )}
                <div className="mt-4 rounded-lg border p-4">
                  <DailyChart data={data.days} dataKey="visitors" label="Visitors" />
                </div>
                {data.errors.analytics && <p className="mt-2 text-xs text-destructive">{data.errors.analytics}</p>}
              </>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Set <code className="rounded bg-muted px-1">CF_ZONE_ID</code> on the admin worker to see traffic for the site.
              </p>
            )}
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="mb-2 text-sm font-semibold">Deployments</h2>
              {!data.configured.account ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Set <code className="rounded bg-muted px-1">CF_ACCOUNT_ID</code> on the admin worker to see Pages deployments.
                </p>
              ) : data.deployments.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{data.errors.deployments || 'No deployments found.'}</p>
              ) : (
                <ul className="divide-y rounded-lg border">
                  {data.deployments.map((d) => (
                    <li key={d.id} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                      <StatusBadge status={d.status === 'success' ? 'done' : d.status === 'failure' ? 'lost' : 'reviewing'} label={d.status || 'unknown'} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{d.message || d.commit || d.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.environment}
                          {d.branch ? ` · ${d.branch}` : ''}
                          {d.commit ? ` · ${d.commit}` : ''} · <span title={formatDateTime(d.createdAt)}>{timeAgo(d.createdAt)}</span>
                        </div>
                      </div>
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Open this deployment">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold">Workers, last {days} days</h2>
              {!data.configured.account ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Set <code className="rounded bg-muted px-1">CF_ACCOUNT_ID</code> on the admin worker to see the workers' request counts.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Worker</th>
                        <th className="px-3 py-2 text-right font-semibold">Requests</th>
                        <th className="px-3 py-2 text-right font-semibold">Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.workers.map((w) => (
                        <tr key={w.name}>
                          <td className="px-3 py-2 font-mono text-xs">{w.name}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{formatNumber(w.requests)}</td>
                          <td className={`px-3 py-2 text-right tabular-nums ${w.errors ? 'text-destructive' : ''}`}>{formatNumber(w.errors)}</td>
                        </tr>
                      ))}
                      {data.workers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-3 text-xs text-muted-foreground">{data.errors.workers || 'No worker traffic in this period.'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm">
      <div className="font-semibold">Cloudflare is not connected yet</div>
      <p className="mt-1 text-muted-foreground">
        Create an API token in the Cloudflare dashboard with <em>Analytics: Read</em> on the zone, <em>Workers Scripts: Read</em> and <em>Cloudflare Pages: Read</em> on the account, and set it on the admin
        worker as <code className="rounded bg-muted px-1">CF_API_TOKEN</code>, with <code className="rounded bg-muted px-1">CF_ACCOUNT_ID</code> and <code className="rounded bg-muted px-1">CF_ZONE_ID</code>. The steps are in
        docs/ADMIN_DASHBOARD.md.
      </p>
    </div>
  );
}

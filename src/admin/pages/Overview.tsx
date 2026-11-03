/**
 * The first screen: what has come in, what needs doing, and whether the site
 * is healthy. Everything links through to the page that deals with it.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAdmin } from '../auth';
import type { CloudflareSummary, GoogleSummary, JobsList, QuotesList } from '../api/types';
import { ErrorNote, Loading, PageHeader, Stat, StatusBadge, formatNumber, timeAgo } from '../ui';

export function Overview() {
  const { api, user } = useAdmin();
  const [jobs, setJobs] = useState<JobsList | null>(null);
  const [quotes, setQuotes] = useState<QuotesList | null>(null);
  const [cf, setCf] = useState<CloudflareSummary | null>(null);
  const [google, setGoogle] = useState<GoogleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([api.listJobs(), api.listQuotes()])
      .then(([j, q]) => {
        if (!live) return;
        setJobs(j);
        setQuotes(q);
      })
      .catch((e: Error) => live && setError(e.message));
    if (user?.capabilities.cloudflare) api.cloudflare(7).then((r) => live && setCf(r)).catch(() => undefined);
    if (user?.capabilities.google === 'connected') api.googleSummary(28).then((r) => live && setGoogle(r)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [api, user]);

  if (error) return <ErrorNote message={error} />;
  if (!jobs || !quotes) return <Loading what="Loading the overview" />;

  const inProgress = (jobs.counts.reviewing || 0) + (jobs.counts.quoted || 0) + (jobs.counts.ordered || 0);
  const latestDeploy = cf?.deployments.find((d) => d.environment === 'production');

  return (
    <div>
      <PageHeader title="Overview" blurb="What has come in, what is in hand, and how the site is doing." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New jobs" value={jobs.counts.new || 0} hint="From the shower designer, not yet looked at" />
        <Stat label="Jobs in hand" value={inProgress} hint="Reviewing, quoted or ordered" />
        <Stat label="New quote enquiries" value={quotes.counts.new || 0} hint="From the quote form" />
        {cf?.totals ? (
          <Stat label="Visitors, last 7 days" value={formatNumber(cf.totals.visitors)} hint={`${formatNumber(cf.totals.pageViews)} page views`} />
        ) : google?.reviews ? (
          <Stat label="Google rating" value={google.reviews.averageRating ?? '–'} hint={`${google.reviews.total} reviews`} />
        ) : (
          <Stat label="Site traffic" value="–" hint={<Link to="/admin/site" className="underline underline-offset-2">Connect Cloudflare</Link>} />
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Latest jobs</h2>
            <Link to="/admin/jobs" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All jobs <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {jobs.jobs.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nothing yet. Designs sent from customshowers.uk/design-shower appear here once the design worker is deployed with its
              database binding.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {jobs.jobs.slice(0, 6).map((j) => (
                <li key={j.id}>
                  <Link to={`/admin/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{j.customer.name || 'Unnamed'}</span>
                        <StatusBadge status={j.status} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {j.headline || j.id}
                        {j.customer.postcode ? ` · ${j.customer.postcode}` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(j.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Latest quote enquiries</h2>
            <Link to="/admin/quotes" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              All enquiries <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {quotes.quotes.length === 0 ? (
            <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Nothing yet. Quote-form enquiries appear here once the contact worker is deployed with its database binding.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {quotes.quotes.slice(0, 6).map((q) => (
                <li key={q.id}>
                  <Link to={`/admin/quotes?open=${q.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{q.name || 'Unnamed'}</span>
                        <StatusBadge status={q.status} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {q.serviceType ? `${q.serviceType} · ` : ''}
                        {q.message || q.address || q.id}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(q.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(latestDeploy || google?.reviews) && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {latestDeploy && (
            <section className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold">Site</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last production deploy {timeAgo(latestDeploy.createdAt)}: {latestDeploy.message || latestDeploy.commit}
              </p>
              <p className="mt-1 text-xs">
                <StatusBadge status={latestDeploy.status === 'success' ? 'done' : latestDeploy.status === 'failure' ? 'lost' : 'reviewing'} label={latestDeploy.status || 'unknown'} />
                <Link to="/admin/site" className="ml-3 underline underline-offset-2">
                  Traffic and deployments
                </Link>
              </p>
            </section>
          )}
          {google?.reviews && (
            <section className="rounded-lg border p-4">
              <h2 className="text-sm font-semibold">Google profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {google.reviews.averageRating} stars over {google.reviews.total} reviews
                {google.metrics ? `; ${formatNumber(google.metrics.totals.impressions)} views in ${google.metrics.days} days` : ''}.
              </p>
              <p className="mt-1 text-xs">
                <Link to="/admin/google" className="underline underline-offset-2">
                  Reviews and performance
                </Link>
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

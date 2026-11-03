/**
 * Every design sent from the shower designer, newest first, with a filter
 * by status and a search over the customer and the job.
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useAdmin } from '../auth';
import { JOB_STATUSES, type JobStatus, type JobsList } from '../api/types';
import { Empty, ErrorNote, JOB_STATUS_LABEL, Loading, PageHeader, StatusBadge, formatDateTime, timeAgo } from '../ui';

export function Jobs() {
  const { api } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') as JobStatus | null) || null;
  const [q, setQ] = useState(params.get('q') || '');
  const [list, setList] = useState<JobsList | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      api
        .listJobs({ status, q })
        .then((r) => live && setList(r))
        .catch((e: Error) => live && setError(e.message));
    }, 150);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [api, status, q]);

  const setStatus = (s: JobStatus | null) => {
    const next = new URLSearchParams(params);
    if (s) next.set('status', s);
    else next.delete('status');
    setParams(next, { replace: true });
  };

  const total = list ? Object.values(list.counts).reduce((a, b) => a + (b || 0), 0) : 0;

  return (
    <div>
      <PageHeader title="Jobs" blurb="Designs sent from the shower designer. Each one carries the customer's measurements, the drawings and the cut sizes." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <FilterChip active={status === null} onClick={() => setStatus(null)} label="All" count={total} />
          {JOB_STATUSES.map((s) => (
            <FilterChip key={s} active={status === s} onClick={() => setStatus(s)} label={JOB_STATUS_LABEL[s]} count={list?.counts[s] || 0} />
          ))}
        </div>
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, postcode, job number"
          className="ml-auto h-9 w-full sm:w-72"
          aria-label="Search jobs"
        />
      </div>

      {error ? (
        <ErrorNote message={error} />
      ) : !list ? (
        <Loading what="Loading jobs" />
      ) : list.jobs.length === 0 ? (
        <Empty
          title={q || status ? 'No jobs match' : 'No jobs yet'}
          blurb={
            q || status
              ? 'Try another status or search.'
              : 'Designs sent from customshowers.uk/design-shower will appear here once the design worker has its database binding.'
          }
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {list.jobs.map((j) => (
            <li key={j.id}>
              <Link to={`/admin/jobs/${j.id}`} className="grid gap-1 px-4 py-3 transition-colors hover:bg-muted/50 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_auto] sm:items-center sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{j.customer.name || 'Unnamed'}</span>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {j.id}
                    {j.customer.postcode ? ` · ${j.customer.postcode}` : ''}
                  </div>
                </div>
                <div className="min-w-0 text-sm text-muted-foreground">
                  <span className="truncate">{j.headline || 'Design'}</span>
                  {(j.flags.tooFast || j.flags.challengeSkipped) && (
                    <span className="ml-2 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                      {j.flags.tooFast ? 'fast' : 'unverified'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground sm:text-right" title={formatDateTime(j.createdAt)}>
                  {timeAgo(j.createdAt)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150 ${
        active ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
      {typeof count === 'number' && <span className={`ml-1 ${active ? 'opacity-70' : 'opacity-60'}`}>{count}</span>}
    </button>
  );
}

/**
 * One job: who sent it, what they measured, the drawings redrawn from their
 * design, the cut sizes and hardware the workshop will make it from, their
 * photos, and the notes and history of what has happened since.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, Mail, Phone, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlanView } from '@/configurator/views/PlanView';
import { ElevationView } from '@/configurator/views/ElevationView';
import { journeySummary } from '@/configurator/journey';
import { getTenant } from '@/configurator/tenant';
import { useAdmin } from '../auth';
import { JOB_STATUSES, type JobDetail, type JobStatus } from '../api/types';
import { attachmentLabel, mailtoCustomer } from '../jobs';
import { ErrorNote, JOB_STATUS_LABEL, Loading, PageHeader, StatusBadge, formatBytes, formatDateTime, timeAgo } from '../ui';

const tenant = getTenant();

export function JobDetailPage() {
  const { id = '' } = useParams();
  const { api } = useAdmin();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    api
      .getJob(id)
      .then((j) => {
        if (!live) return;
        setJob(j);
        setNotes(j.notes || '');
      })
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [api, id]);

  const setStatus = async (status: JobStatus) => {
    if (!job) return;
    setSaving(true);
    try {
      setJob(await api.updateJob(job.id, { status }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    if (!job || notes === (job.notes || '')) return;
    setSaving(true);
    try {
      setJob(await api.updateJob(job.id, { notes }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorNote message={error} />;
  if (!job) return <Loading what="Loading the job" />;

  return (
    <div>
      <Link to="/admin/jobs" className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All jobs
      </Link>
      <PageHeader
        title={job.customer.name || 'Unnamed customer'}
        blurb={
          <>
            {job.id} · received {formatDateTime(job.createdAt)} ({timeAgo(job.createdAt)})
            {job.headline ? ` · ${job.headline}` : ''}
          </>
        }
        actions={
          <>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status</span>
              <select
                value={job.status}
                disabled={saving}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="h-9 rounded border bg-background px-2 text-sm"
                aria-label="Job status"
              >
                {JOB_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {JOB_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <Button asChild variant="outline" size="sm">
              <Link to={`/admin/jobs/${job.id}/fitting`} target="_blank" rel="noreferrer">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Fitting sheet
              </Link>
            </Button>
          </>
        }
      />

      {(job.flags.tooFast || job.flags.challengeSkipped) && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {job.flags.tooFast && 'This design was completed unusually fast, which can mean a script rather than a person. '}
          {job.flags.challengeSkipped && 'The security check did not run for this visitor (usually an ad blocker). '}
          Worth a glance before replying.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-8">
          <Drawings job={job} />
          <Measurements job={job} />
          <PanelSchedule job={job} />
          <Photos job={job} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Customer</h2>
            <dl className="mt-2 space-y-1.5 text-sm">
              {job.customer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a href={mailtoCustomer(job)} className="truncate underline-offset-2 hover:underline">
                    {job.customer.email}
                  </a>
                </div>
              )}
              {job.customer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <a href={`tel:${job.customer.phone.replace(/\s+/g, '')}`} className="underline-offset-2 hover:underline">
                    {job.customer.phone}
                  </a>
                </div>
              )}
              {job.customer.postcode && <div className="pl-5.5 text-muted-foreground">{job.customer.postcode}</div>}
            </dl>
            {job.payload.customer?.notes && (
              <blockquote className="mt-3 border-l-2 pl-3 text-sm text-muted-foreground">{job.payload.customer.notes}</blockquote>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {job.emailed ? 'The workshop email was sent.' : 'The workshop email was not sent.'} Customer{' '}
              {job.payload.customer?.measurementsAcknowledged ? 'accepted' : 'did not accept'} the measurements disclaimer.
            </p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Hardware and glass</h2>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {[
                ['Fixing', job.summary.mounting],
                ['Finish', job.summary.finish],
                ['Handle', job.summary.handle],
                ['Glass', `${job.summary.glassType}, ${job.summary.glass}`],
                ['Coating', job.summary.glassCoating],
                ['Height', job.summary.heightMm],
                ['Run', job.summary.runWidthMm],
                ...(job.payload.spec?.mounting === 'channel' ? [['Channel', `${job.payload.spec.totalChannelLengthMm}mm`]] : []),
                ['Weight', `${job.payload.spec?.totalGlassWeightKg ?? '–'}kg`],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Notes</h2>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={4} className="mt-2 text-sm" placeholder="What you told the customer, what to check, what was agreed." />
            <p className="mt-1 text-xs text-muted-foreground">{saving ? 'Saving…' : 'Saved when you click away.'}</p>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">History</h2>
            <ol className="mt-2 space-y-2 text-xs">
              {job.events.map((e) => (
                <li key={e.id} className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground" title={formatDateTime(e.at)}>
                    {timeAgo(e.at)}
                  </span>
                  <span className="min-w-0">
                    {e.kind === 'status' ? (
                      <>
                        <span className="text-muted-foreground">{e.actor} set </span>
                        {e.detail}
                      </>
                    ) : e.kind === 'note' ? (
                      <>
                        <span className="text-muted-foreground">{e.actor} noted: </span>
                        {e.detail}
                      </>
                    ) : (
                      e.detail
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Files</h2>
            <ul className="mt-2 space-y-1 text-xs">
              {job.attachments.map((a) => (
                <li key={a.filename} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {attachmentLabel(a)} <span className="text-muted-foreground">({formatBytes(a.bytes)})</span>
                  </span>
                  <a href={api.jobFileUrl(job.id, a.filename)} download={a.filename} className="flex shrink-0 items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Download className="h-3 w-3" /> {a.filename.split('.').pop()?.toUpperCase()}
                  </a>
                </li>
              ))}
              {job.attachments.length === 0 && <li className="text-muted-foreground">No files were kept for this job.</li>}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

/** The width of an element, kept up to date, so a drawing can fit its column. */
function useWidth<T extends HTMLElement>(): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** The plan and elevation, redrawn as vectors from the design the customer sent. */
export function Drawings({ job, width = 560 }: { job: JobDetail; width?: number }) {
  const { api } = useAdmin();
  const design = job.payload.design;
  const finish = tenant.finishes.find((f) => f.id === design?.finishId)?.swatch ?? '#d4d8db';
  const drawings = job.attachments.filter((a) => a.kind === 'drawing');
  const [gridRef, gridWidth] = useWidth<HTMLDivElement>();
  // Two columns from the md breakpoint, one below it; 12px gap, 16px card padding.
  const columns = gridWidth >= 768 ? 2 : 1;
  const fit = gridWidth ? Math.floor((gridWidth - (columns - 1) * 12) / columns) - 18 : width;
  const drawWidth = Math.max(240, Math.min(width, fit));
  if (!design) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold">Drawings</h2>
        {drawings.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {drawings.map((a) => (
              <figure key={a.filename} className="overflow-hidden rounded-lg border bg-white">
                <img src={api.jobFileUrl(job.id, a.filename)} alt={attachmentLabel(a)} className="w-full" />
                <figcaption className="border-t px-3 py-1.5 text-xs text-muted-foreground">{attachmentLabel(a)}</figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No drawings were kept with this job.</p>
        )}
      </section>
    );
  }
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Drawings</h2>
      <div ref={gridRef} className="grid gap-3 md:grid-cols-2">
        <figure className="overflow-hidden rounded-lg border bg-white">
          <figcaption className="border-b px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan</figcaption>
          <div className="flex justify-center overflow-x-auto p-2">
            <PlanView panels={design.panels} junctions={design.junctions} leftWall={design.leftWall} rightWall={design.rightWall} width={drawWidth} height={Math.round(drawWidth * 0.62)} accent={tenant.brand.primary} />
          </div>
        </figure>
        <figure className="overflow-hidden rounded-lg border bg-white">
          <figcaption className="border-b px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Elevation</figcaption>
          <div className="flex justify-center overflow-x-auto p-2">
            <ElevationView panels={design.panels} junctions={design.junctions} heightMm={design.heightMm} handleId={design.handleId} mounting={design.mounting} finishColor={finish} width={drawWidth} height={Math.round(drawWidth * 0.62)} accent={tenant.brand.primary} />
          </div>
        </figure>
      </div>
      {drawings.length > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          Redrawn from the design. The PNGs the workshop received are under Files.
        </p>
      )}
    </section>
  );
}

/** Every number the customer gave, in the order the designer asked for them. */
export function Measurements({ job }: { job: JobDetail }) {
  const design = job.payload.design;
  const rows = useMemo(() => (design ? journeySummary(design) : []), [design]);
  const spec = job.payload.spec;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">What the customer measured</h2>
      {rows.length ? (
        <dl className="divide-y rounded-lg border">
          {rows.map((r, i) => (
            <div key={`${r.label}-${i}`} className="flex gap-3 px-3 py-2 text-sm">
              <dt className="w-2/5 shrink-0 text-muted-foreground">{r.label}</dt>
              <dd className={r.status === 'missing' ? 'text-red-700 dark:text-red-300' : r.status === 'optional' ? 'text-muted-foreground' : ''}>{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <dl className="divide-y rounded-lg border">
          {[
            ['Opening', job.summary.openingWidths],
            ['Walls and floor', job.summary.openingCondition],
            ['Checked with', job.summary.measuredBy],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 px-3 py-2 text-sm">
              <dt className="w-2/5 shrink-0 text-muted-foreground">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {spec?.rakeNotes?.length > 0 && (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Out of square</div>
          <ul className="mt-1 space-y-1">
            {spec.rakeNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      {(spec?.blockingIssues?.length > 0 || spec?.warnings?.length > 0) && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="text-xs font-semibold uppercase tracking-wider">Check before cutting</div>
          <ul className="mt-1 space-y-1">
            {[...(spec.blockingIssues || []), ...(spec.warnings || [])].map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Cut sizes and hardware, panel by panel, as the workshop received them. */
export function PanelSchedule({ job }: { job: JobDetail }) {
  const spec = job.payload.spec;
  if (!spec?.panels) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Panel schedule</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">Panel</th>
              <th className="px-3 py-2 text-right font-semibold">Measured</th>
              <th className="px-3 py-2 text-right font-semibold">Cut size</th>
              <th className="px-3 py-2 text-right font-semibold">Weight</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {spec.panels.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-3 py-2">
                  <div className="font-medium">{p.label}</div>
                  {p.door && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {p.door.hingeCount} × {p.door.hingeBrand} hinges, {p.door.hingeSide} hand, opens {p.door.swing === 'both' ? 'both ways' : 'outwards'} · {p.door.sealType} · hinge centres{' '}
                      {p.door.hingeHeightsMm.join(' / ')}mm · handle at {p.door.handlePlacement.handleHeight}mm
                    </div>
                  )}
                  {p.notches.length > 0 && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Notches: {p.notches.map((n) => `${n.corner.toLowerCase()} ${n.widthMm}×${n.heightMm}mm`).join(', ')}
                    </div>
                  )}
                  {p.cutouts.length > 0 && (
                    <ul className="mt-0.5 text-xs text-muted-foreground">
                      {p.cutouts.map((c) => (
                        <li key={`${c.description}-${c.heightMm}`}>
                          {c.description} — {c.heightMm}mm, {c.edge}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {p.tightWidthMm} × {p.tightHeightMm}
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm font-semibold tabular-nums">
                  {p.cutWidthMm} × {p.cutHeightMm}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">{p.weightKg}kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(spec.support?.supportPanelRequired || spec.support?.supportBarRequired) && (
        <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">
          {spec.support.supportPanelRequired && `Support panel required: ${spec.support.supportPanelReason}. `}
          {spec.support.supportBarRequired && `Support bar required: ${spec.support.supportBarReason}.`}
        </p>
      )}
    </section>
  );
}

function Photos({ job }: { job: JobDetail }) {
  const { api } = useAdmin();
  const photos = job.attachments.filter((a) => a.kind !== 'drawing');
  if (photos.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">Photos</h2>
      <p className="mb-2 text-xs text-muted-foreground">
        The ones named for a measurement were taken at the wall with the tape in place, so they can be checked against the numbers above.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((a) => (
          <li key={a.filename} className="overflow-hidden rounded-lg border">
            <a href={api.jobFileUrl(job.id, a.filename)} target="_blank" rel="noreferrer" className="block">
              <img src={api.jobFileUrl(job.id, a.filename)} alt={attachmentLabel(a)} className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </a>
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs">
              <span className="truncate font-medium">{attachmentLabel(a)}</span>
              <a href={api.jobFileUrl(job.id, a.filename)} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label={`Open ${attachmentLabel(a)} full size`}>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A compact status chip with its label, for other pages. */
export function JobStatusChip({ status }: { status: JobStatus }) {
  return <StatusBadge status={status} label={JOB_STATUS_LABEL[status]} />;
}

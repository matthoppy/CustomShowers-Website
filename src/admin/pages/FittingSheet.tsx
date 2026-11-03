/**
 * The fitting sheet: a printable document for whoever fits the glass, made
 * from the job's spec and the customer's measurements. Supply-only means the
 * fitter is often not ours, so it assumes a competent tradesperson who has
 * not fitted this particular enclosure before.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { journeySummary } from '@/configurator/journey';
import { RULES } from '@/configurator/rules';
import { useAdmin } from '../auth';
import type { JobDetail } from '../api/types';
import { ErrorNote, Loading, formatDate } from '../ui';
import { Drawings, PanelSchedule } from './JobDetail';

export function FittingSheetPage() {
  const { id = '' } = useParams();
  const { api } = useAdmin();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getJob(id).then(setJob).catch((e: Error) => setError(e.message));
  }, [api, id]);

  useEffect(() => {
    if (job) document.title = `Fitting sheet ${job.id} · Custom Showers`;
  }, [job]);

  if (error) return <div className="p-8"><ErrorNote message={error} /></div>;
  if (!job) return <div className="p-8"><Loading what="Preparing the fitting sheet" /></div>;

  const spec = job.payload.spec;
  const design = job.payload.design;
  const summary = job.summary;
  const doors = spec.panels.filter((p) => p.door);
  const fixed = spec.panels.filter((p) => !p.door);
  const channel = spec.mounting === 'channel';
  const corners = spec.cornerCount;
  const measured = design ? journeySummary(design).filter((r) => r.status === 'done') : [];
  const heaviestFixed = fixed.length ? Math.max(...fixed.map((p) => p.weightKg)) : 0;

  const steps: { title: string; body: string }[] = [
    {
      title: 'Check the glass before anything else',
      body: `Unpack each panel and check it against the schedule: ${spec.panels.map((p) => `${p.label.split(' — ')[0]} ${p.cutWidthMm} × ${p.cutHeightMm}`).join(', ')}. Look along every edge for chips. Toughened glass cannot be cut or drilled on site, so anything wrong is reported now, not after it is fixed to the wall.`,
    },
    {
      title: 'Mark where the glass stands',
      body: `Mark the glass line on the tray or floor${corners ? ' and both corner points' : ''}, about 10mm in from the front edge of the tray, exactly where the customer measured. Check the opening against the sheet: ${
        measured.length ? 'the widths and leans below were taken by the customer and the glass is cut to them.' : 'the glass is cut to the sizes on the schedule.'
      } Dry-fit the hardware positions before drilling.`,
    },
    channel
      ? {
          title: 'Fix the U-channel',
          body: `You have ${spec.totalChannelLengthMm}mm of channel in ${summary.finish}. Cut it to the fixed panels' floor runs and the wall uprights${corners ? ', butted at each corner' : ''}. Fix the wall channel plumb and the floor channel on the glass line into solid fixings (plugs into masonry, never tile adhesive alone), bedded on a continuous bead of clear silicone. Pack behind a wall channel where the wall leans away so the channel stays plumb.`,
        }
      : {
          title: 'Mark and fix the wall clamps',
          body: `Clamps in ${summary.finish} fix each fixed panel to the wall. Mark their centres plumb on the wall at the heights of the glass cut-outs, drill and plug into solid wall, and fit the wall halves loosely. Pack behind a clamp where the wall leans away so the glass is held plumb, and keep a silicone bead down the glass-to-wall edge.`,
        },
    ...(fixed.length
      ? [
          {
            title: `Fit the fixed ${fixed.length === 1 ? 'panel' : 'panels'}`,
            body: `${heaviestFixed > 25 ? `The heaviest panel is ${heaviestFixed}kg: two people with suction cups. ` : ''}Stand each fixed panel on setting blocks so it sits off the floor, plumb it with packers at the wall, and hold it with the channel capping${channel ? '' : ' or the clamp fronts'} before any silicone cures.${
              corners ? ` At ${corners === 1 ? 'the corner' : 'each corner'} the front panel runs through to the outside corner and the return butts behind it with a ${RULES.siliconeJointMm}mm silicone joint; fit the front first.` : ''
            }`,
          },
        ]
      : []),
    ...(doors.length
      ? [
          {
            title: 'Hang the door',
            body: doors
              .map(
                (d) =>
                  `${d.label.split(' — ')[0]}${d.weightKg > 25 ? ` is ${d.weightKg}kg, a two-person lift with suction cups.` : ':'} ${d.door!.hingeCount} × ${d.door!.hingeBrand} hinges on the ${d.door!.hingeSide}, centres ${d.door!.hingeHeightsMm.join(' and ')}mm up from the bottom of the door glass, opening ${d.door!.swing === 'both' ? 'both ways' : 'outwards only'}. Fit the hinges to the fixed glass or the wall first, then offer the door up on a 3mm packer off the floor and tighten evenly. Check it closes with an even gap and the ${d.door!.sealType} seats along the closing edge. The handle holes are at ${d.door!.handleHoleHeightsMm.lowerMm} and ${d.door!.handleHoleHeightsMm.upperMm}mm${summary.handle.toLowerCase().includes('knob') ? '' : ' for the pull'}.`
              )
              .join(' '),
          },
        ]
      : []),
    {
      title: 'Seal and leave to cure',
      body: `Fit the door seals and any bottom seal, then run a neat bead of clear bathroom silicone along the outside of the glass-to-wall and glass-to-tray joints${channel ? ' and the top edge of the channel' : ''}. Leave the inside unsealed at the bottom of a door so water drains. Do not use the shower for 24 hours.`,
    },
    {
      title: 'Final checks',
      body: 'Glass plumb and level, door swings freely and closes square, no bare screw heads, all protective film removed, the customer shown how to open the door and that silicone needs a day.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-foreground print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <a href={`/admin/jobs/${job.id}`} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
          Back to the job
        </a>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
        </Button>
      </div>

      <header className="border-b pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Showers · Fitting sheet</div>
            <h1 className="text-2xl font-bold">{job.id}</h1>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">{job.customer.name}</div>
            <div className="text-muted-foreground">
              {job.customer.postcode} · received {formatDate(job.createdAt)}
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {job.headline}. {summary.glassType} {summary.glass}, {summary.mounting.toLowerCase()}, {summary.finish.toLowerCase()} hardware, {summary.handle.toLowerCase()}.
          Supply only: this sheet and the drawings are what the fitter works from.
        </p>
      </header>

      <section className="mt-6">
        <h2 className="text-base font-semibold">The glass</h2>
        <div className="mt-2">
          <PanelSchedule job={job} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cut sizes include the deductions for {spec.mounting === 'channel' ? 'channel' : 'clamps'}, silicone joints and the door swing. Total glass {spec.totalGlassWeightKg}kg.
        </p>
      </section>

      <section className="mt-6 break-inside-avoid">
        <Drawings job={job} width={440} />
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-base font-semibold">Hardware</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {doors.map((d) => (
              <li key={d.id}>
                {d.door!.hingeCount} × {d.door!.hingeBrand} hinges, {summary.finish.toLowerCase()}, for {d.label.split(' — ')[0]}
              </li>
            ))}
            {doors.length > 0 && <li>{summary.handle} in {summary.finish.toLowerCase()}</li>}
            {doors.map((d) => (
              <li key={`${d.id}-seal`}>{d.door!.sealType} for {d.label.split(' — ')[0]}</li>
            ))}
            <li>{channel ? `${spec.totalChannelLengthMm}mm U-channel in ${summary.finish.toLowerCase()}` : `Glass clamps in ${summary.finish.toLowerCase()} for ${fixed.length} fixed ${fixed.length === 1 ? 'panel' : 'panels'}`}</li>
            {spec.support.supportPanelRequired && <li>Support panel: {spec.support.supportPanelReason}</li>}
            {spec.support.supportBarRequired && <li>Support bar: {spec.support.supportBarReason}</li>}
            <li>Clear bathroom silicone, setting blocks, glazing packers</li>
          </ul>
        </div>
        <div>
          <h2 className="text-base font-semibold">The opening, as measured</h2>
          {measured.length ? (
            <dl className="mt-2 space-y-1 text-sm">
              {measured.map((r, i) => (
                <div key={`${r.label}-${i}`} className="flex gap-2">
                  <dt className="w-2/5 shrink-0 text-muted-foreground">{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm">{summary.openingWidths}. {summary.openingCondition}. Checked with: {summary.measuredBy}.</p>
          )}
          {spec.rakeNotes.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {spec.rakeNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {(spec.warnings.length > 0 || spec.blockingIssues.length > 0) && (
        <section className="mt-6 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:bg-transparent dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider">Check before fitting</h2>
          <ul className="mt-1 space-y-1">
            {[...spec.blockingIssues, ...spec.warnings].map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-base font-semibold">Fitting order</h2>
        <ol className="mt-2 space-y-3">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3 break-inside-avoid">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground print:border print:bg-transparent print:text-foreground">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        <p>
          Glass is made to the customer's own measurements. If the opening does not match this sheet, stop and contact Custom Showers before fixing anything: sales@customshowers.uk.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-8 print:mt-10">
          <div className="border-t pt-1">Fitted by</div>
          <div className="border-t pt-1">Date</div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Measure step — the customer does the survey.
 *
 * Laid out as a numbered checklist rather than a sub-wizard. Someone doing
 * this is standing in a bathroom with a phone in one hand and a tape in the
 * other, and they will go back and forth between measurements as they realise
 * they need to check one again. A wizard fights that; a list does not.
 *
 * Every measurement gets its own diagram, because the failure mode here is
 * not the customer misreading a tape — it is the customer measuring something
 * other than the thing we asked for.
 */

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Check, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PhotoCapture } from '../PhotoCapture';
import { releasePhoto, type Photo, type PhotoSlot } from '../photos';
import {
  checkMeasurements,
  runLabels,
  signedLeanMm,
  topWidthMm,
  wallLean,
  wallMeasured,
  wallsForRun,
  type MeasureMethod,
  type OpeningMeasurements,
  type RunMeasurement,
  type WallMeasurement,
} from '../measure';
import { openingContext, runPanelIndices } from '../geometry';
import type { ConfiguratorPanel } from '../types';
import {
  FIGURE_CAPTIONS,
  MeasureDiagram,
  OpeningPreview,
  type MeasureFigure,
} from '../views/MeasureDiagram';
import type { StepProps } from './types';

const HEIGHT_PRESETS = [1500, 1850, 2000, 2100];

/**
 * Each method gets its own drawing, because what the customer does with their
 * hands differs completely between them — and the drawing is the instruction.
 */
const METHODS: {
  id: MeasureMethod;
  label: string;
  blurb: string;
  figure: MeasureFigure | null;
}[] = [
  {
    id: 'packers',
    label: 'Level and packers',
    blurb: 'A level held against the wall, then glazing packers pushed into the gap until snug. The easiest to get right, because you are matching a thickness rather than reading a tape.',
    figure: 'wall-packers',
  },
  {
    id: 'level',
    label: 'Spirit level',
    blurb: 'A long level held against the wall, measuring the gap at the loose end. The longer the level the better — a short one on a tall wall will miss a gentle lean.',
    figure: 'wall-level',
  },
  {
    id: 'laser',
    label: 'Laser line',
    blurb: 'A self-levelling laser gives a true vertical the full height of the wall. The most accurate of the three if you have one.',
    figure: 'wall-laser',
  },
  {
    id: 'assumed-square',
    label: "Haven't checked",
    blurb: 'You can send it like this, but we will cut to square — and if the walls are not, the gaps will show.',
    figure: null,
  },
];

/**
 * The A4 trick, offered on the width photos.
 *
 * A sheet of A4 is 210 x 297mm everywhere, so a photo with one taped up in it
 * carries its own ruler. It is nowhere near accurate enough to cut from —
 * perspective alone costs a percent or two — but it does not need to be. It
 * catches the mistakes that actually reach a workshop: a digit dropped,
 * centimetres typed as millimetres, the wrong wall measured. Those are the
 * ones that cost a panel, and they are obvious the moment there is something
 * of known size in the frame.
 *
 * Framed as a bonus rather than a step, because a customer who does not have
 * a sheet to hand should not feel stopped.
 */
function A4Hint() {
  return (
    <p className="rounded bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      <strong className="text-foreground">Worth doing if you can:</strong> tape a sheet of A4
      paper to the wall where it will be in the photo. It is exactly 210 × 297mm, so it gives us
      something of known size to check your measurement against — the quickest way for us to
      spot a slip before anything is cut.
    </p>
  );
}

/** A diagram with its caption underneath, where the text can wrap. */
function Figure({ figure }: { figure: MeasureFigure }) {
  return (
    <figure className="space-y-2">
      <MeasureDiagram figure={figure} className="w-full rounded bg-muted/40 p-2" />
      <figcaption className="text-xs text-muted-foreground">
        {FIGURE_CAPTIONS[figure]}
      </figcaption>
    </figure>
  );
}

/** One numbered section: diagram on one side, the input on the other. */
function Measurement({
  number,
  title,
  figure,
  help,
  children,
}: {
  number: number;
  title: string;
  figure?: MeasureFigure;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {number}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {figure && <Figure figure={figure} />}
        <div className={figure ? 'space-y-3' : 'space-y-3 sm:col-span-2'}>
          {children}
          {help && <p className="text-xs text-muted-foreground">{help}</p>}
        </div>
      </div>
    </section>
  );
}

/** A nullable millimetre box. Empty means not measured, which is not zero. */
function GapInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        className="w-full"
        placeholder="mm"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim();
          onChange(raw === '' ? null : Math.max(0, parseInt(raw, 10) || 0));
        }}
      />
    </div>
  );
}

/**
 * One wall, as two tape readings against a vertical reference.
 *
 * The customer is never asked which way it leans — that falls out of which
 * reading is bigger. Asking was the shakiest part of the old flow: it is a
 * question people answer confidently and wrongly, and getting it backwards
 * puts the panel out by twice the lean instead of nothing.
 */
function WallGaps({
  name,
  wall,
  onChange,
}: {
  name: string;
  wall: WallMeasurement;
  onChange: (patch: Partial<WallMeasurement>) => void;
}) {
  const lean = wallLean(wall);

  return (
    <div className="space-y-3 rounded border p-3">
      <Label className="text-sm font-medium">{name}</Label>
      <div className="grid grid-cols-2 gap-2">
        <GapInput
          label="Gap at the bottom"
          value={wall.gapBottomMm}
          onChange={(v) => onChange({ gapBottomMm: v })}
        />
        <GapInput
          label="Gap at the top"
          value={wall.gapTopMm}
          onChange={(v) => onChange({ gapTopMm: v })}
        />
      </div>
      <GapInput
        label="Gap at mid height (optional)"
        value={wall.gapMiddleMm}
        onChange={(v) => onChange({ gapMiddleMm: v })}
      />

      {lean && (
        <div
          className={`rounded px-3 py-2 text-xs ${
            lean.isBowed
              ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
              : 'bg-muted/60'
          }`}
        >
          {lean.leanMm === 0 ? (
            <>That wall is <strong>plumb</strong>.</>
          ) : (
            <>
              That makes it <strong>{lean.leanMm}mm out of plumb</strong>, leaning{' '}
              {lean.direction === 'in' ? 'into the shower' : 'away from the shower'} at the top.
            </>
          )}
          {lean.isBowed && (
            <>
              {' '}
              The middle reading is {Math.abs(lean.bowMm ?? 0)}mm off a straight line, so it bows
              rather than leans.
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * How many cards the phone layout walks through for a given shape.
 *
 * Height, then a pair of width cards per straight run, then the walls, the
 * floor and the confirmation. A corner shower is two runs and so four width
 * cards — the customer really does have to walk to the other wall and
 * measure it, and pretending otherwise is how a return panel comes out wrong.
 */
export function measureCardCount(runCount: number): number {
  return 4 + Math.max(1, runCount);
}

/**
 * Spread a new width across one run's panels, keeping their proportions. The
 * rounding remainder goes on the widest panel, where a millimetre matters
 * least — the alternative is a run that does not add up to the wall it fills.
 */
function scaleRunPanels(
  panels: ConfiguratorPanel[],
  indices: number[],
  targetMm: number
): ConfiguratorPanel[] {
  const total = indices.reduce((sum, i) => sum + panels[i].width_mm, 0);
  if (total <= 0 || targetMm <= 0) return panels;

  const next = [...panels];
  for (const i of indices) {
    next[i] = {
      ...next[i],
      width_mm: Math.max(1, Math.round((panels[i].width_mm / total) * targetMm)),
    };
  }

  const drift = targetMm - indices.reduce((sum, i) => sum + next[i].width_mm, 0);
  if (drift !== 0) {
    const widest = indices.reduce((a, b) => (next[b].width_mm > next[a].width_mm ? b : a));
    next[widest] = { ...next[widest], width_mm: next[widest].width_mm + drift };
  }
  return next;
}

export function MeasureStep({ state, update, photos, setPhotos, measureCard }: StepProps) {
  const m = state.opening;
  const ctx = openingContext(state);
  const isMobile = useIsMobile();
  const topRef = useRef<HTMLDivElement>(null);

  const runs = m.runs;
  const labels = ctx.labels ?? runLabels(runs.length);
  const runIndices = runPanelIndices(state.panels, state.junctions);
  const cardCount = measureCardCount(runs.length);
  const cardIndex = Math.min(measureCard ?? 0, cardCount - 1);

  const patch = (p: Partial<OpeningMeasurements>) => update({ opening: { ...m, ...p } });

  const patchRun = (i: number, p: Partial<RunMeasurement>) =>
    patch({
      runs: runs.map((r, j) => (j === i ? { ...r, ...p } : r)),
      shapeConfirmed: false,
    });

  /**
   * A run's floor width is the wall it fills, so its panels have to follow.
   * Without this the customer measures 1000mm and then sees a drawing of the
   * template's default, which reads as the tool ignoring them.
   */
  const setRunFloorWidth = (i: number, widthMm: number) =>
    update({
      panels: scaleRunPanels(state.panels, runIndices[i] ?? [], widthMm),
      opening: {
        ...m,
        runs: runs.map((r, j) => (j === i ? { ...r, widthAtFloorMm: widthMm } : r)),
        shapeConfirmed: false,
      },
    });

  const patchWall = (key: 'startWall' | 'endWall', p: Partial<WallMeasurement>) =>
    patch({ [key]: { ...m[key], ...p }, shapeConfirmed: false } as Partial<OpeningMeasurements>);

  const photoFor = (slot: PhotoSlot) => photos.find((p) => p.slot === slot);
  const setPhotoFor = (slot: PhotoSlot, photo: Photo | null) => {
    const rest = photos.filter((p) => p.slot !== slot);
    setPhotos(photo ? [...rest, photo] : rest);
  };

  const allChecks = checkMeasurements(m, ctx);

  /**
   * Apply a corrected value the check offered.
   *
   * Telling someone their 90 should have been 900 and leaving them to retype
   * it invites the same slip again; handing them the right number to accept
   * does not. The field is read back out of the check's code, which is why
   * the codes carry the run index and the field name.
   */
  const applySuggestion = (check: (typeof allChecks)[number]) => {
    if (check.suggestionMm === undefined || check.runIndex === undefined) return;
    if (check.code.includes('widthAtFloor')) {
      setRunFloorWidth(check.runIndex, check.suggestionMm);
    } else if (check.code.includes('widthAtTopCheck')) {
      patchRun(check.runIndex, { widthAtTopCheckMm: check.suggestionMm });
    }
  };

  /**
   * Which card a given check becomes answerable on.
   *
   * On a phone the customer sees one measurement at a time, so a check is
   * only worth raising once they have been shown the card that produces it.
   * Telling someone on the floor-width card that they have not said how they
   * checked the walls is noise about a question they have not been asked yet
   * — and noise is how a real contradiction gets scrolled past.
   */
  const checkCardIndex = (check: (typeof allChecks)[number]): number => {
    const { code, runIndex } = check;
    if (runIndex !== undefined) {
      const floorCard = 1 + runIndex * 2;
      if (code.includes('widthAtFloor')) return floorCard;
      if (code.includes('widthAtTop')) return floorCard + 1;
      // A mismatch is only fixable once the wall leans have been asked for.
      if (code.includes('cross-check')) return 1 + runs.length * 2;
      if (code.includes('floor-')) return 2 + runs.length * 2;
    }
    if (code.startsWith('startWall') || code.startsWith('endWall')) return 1 + runs.length * 2;
    if (code === 'no-method' || code === 'assumed-square') return 1 + runs.length * 2;
    if (code === 'shape-unconfirmed') return cardCount - 1;
    return 0;
  };

  // Desktop shows the lot: every card is on screen, so every check is about
  // something the customer can see.
  const checks = isMobile
    ? allChecks.filter((c) => checkCardIndex(c) <= cardIndex)
    : allChecks;
  const blocking = checks.filter((c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed');
  const confirms = checks.filter((c) => c.level === 'confirm');
  // The preview is drawn from every measurement, so it waits on all of them
  // rather than only the ones raised so far.
  const anyBlocking = allChecks.some(
    (c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed'
  );

  const intro = (
    <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="space-y-2 text-sm">
        <p className="font-semibold">We cut the glass to these numbers.</p>
        <p className="text-muted-foreground">
          Toughened glass cannot be trimmed once it is made, so take your time over this part.
          You will need a tape measure, and ideally a laser or a spirit level to check the walls.
          A sheet of A4 paper is worth having too — we will explain why. It takes about ten
          minutes.
          {runs.length > 1 &&
            ' Your shower turns a corner, so there are two walls to measure — each one separately.'}
        </p>
        <p className="text-muted-foreground">
          Everything is in <strong>millimetres</strong> — a 1.4 metre opening is 1400.
        </p>
      </div>
    </div>
  );

  const alerts = (
    <>
      {blocking.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-red-900 dark:text-red-200">
              Something does not add up
            </div>
            {blocking.map((c) => (
              <div key={c.code} className="space-y-2">
                <p className="text-red-800 dark:text-red-300">{c.message}</p>
                {c.suggestionMm !== undefined && (
                  <Button size="sm" variant="outline" onClick={() => applySuggestion(c)}>
                    Use {c.suggestionMm}mm
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {confirms.length > 0 && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-amber-900 dark:text-amber-200">
              Worth double-checking
            </div>
            {confirms.map((c) => (
              <p key={c.code} className="text-amber-800 dark:text-amber-300">
                {c.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </>
  );

  /** How a run is referred to in a sentence. */
  const runPhrase = (i: number) => (runs.length > 1 ? ` — ${labels[i].toLowerCase()}` : '');

  type Card = { title: string; figure?: MeasureFigure; help?: string; body: JSX.Element };
  const cards: Card[] = [
    {
      title: 'How tall should the glass be?',
      figure: 'height',
      help: 'Most enclosures are 2000–2100mm. A screen over a bath is usually around 1500mm.',
      body: (
        <>
          <Label htmlFor="height">Height (mm)</Label>
          <Input
            id="height"
            type="number"
            inputMode="numeric"
            value={state.heightMm}
            onChange={(e) => update({ heightMm: parseInt(e.target.value, 10) || 0 })}
          />
          <div className="flex flex-wrap gap-2">
            {HEIGHT_PRESETS.map((h) => (
              <Button
                key={h}
                size="sm"
                variant={state.heightMm === h ? 'default' : 'outline'}
                onClick={() => update({ heightMm: h })}
              >
                {h}
              </Button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded border p-3">
            <Checkbox
              checked={state.isFloorToCeiling}
              onCheckedChange={(v) => update({ isFloorToCeiling: v === true })}
            />
            <span className="text-sm">The glass goes all the way to the ceiling</span>
          </label>
          <PhotoCapture
            slot="height"
            prompt="Show us the tape running from the floor up to where the glass will finish."
            photo={photoFor('height')}
            onChange={(p) => setPhotoFor('height', p)}
          />
        </>
      ),
    },
  ];

  // Two cards per run: along the floor, then at the top. The customer
  // physically walks to a different wall for each run, so they get their own
  // screens rather than being crammed into one.
  runs.forEach((run, i) => {
    const endsAtCorner = i < runs.length - 1;
    const startsAtCorner = i > 0;
    const between =
      runs.length === 1
        ? 'from wall to wall'
        : `from ${startsAtCorner ? 'the corner' : 'the wall'} to ${
            endsAtCorner ? 'the corner' : 'the wall'
          }`;

    cards.push({
      title: `Width at the floor${runPhrase(i)}`,
      figure: 'width-floor',
      help: `Measure ${between}, to the tiles or finished surface rather than the plaster behind them.`,
      body: (
        <>
          <Label htmlFor={`w-floor-${i}`}>Width at the floor (mm)</Label>
          <Input
            id={`w-floor-${i}`}
            type="number"
            inputMode="numeric"
            value={run.widthAtFloorMm}
            onChange={(e) => setRunFloorWidth(i, parseInt(e.target.value, 10) || 0)}
          />
          {runs.length > 1 && (
            <p className="rounded bg-muted/60 px-3 py-2 text-xs">
              This is the <strong>{labels[i].toLowerCase()}</strong>, measured {between}. At a
              corner, measure to the outside face of the glass on the other run.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            You do not need to measure the top. We work that out from this width and how far the
            walls lean, which you will tell us in a moment.
          </p>

          {/* Offered, not asked for. Someone who measured the top anyway gets
              it checked against the derived figure; everyone else is not sent
              up a ladder for a number we can already work out. */}
          <details className="rounded border px-3 py-2">
            <summary className="cursor-pointer text-xs font-medium">
              Measured the top as well? Let us check it
            </summary>
            <div className="mt-2 space-y-1.5">
              <Label htmlFor={`w-top-${i}`} className="text-xs text-muted-foreground">
                Width at the top (mm) — optional
              </Label>
              <Input
                id={`w-top-${i}`}
                type="number"
                inputMode="numeric"
                placeholder="Leave blank if you did not measure it"
                value={run.widthAtTopCheckMm ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  patchRun(i, {
                    widthAtTopCheckMm: raw === '' ? null : parseInt(raw, 10) || 0,
                  });
                }}
              />
            </div>
          </details>

          <PhotoCapture
            slot={`width-floor-${i}` as PhotoSlot}
            prompt="Show the tape flat on the floor, with both ends in place."
            hint={<A4Hint />}
            photo={photoFor(`width-floor-${i}` as PhotoSlot)}
            onChange={(p) => setPhotoFor(`width-floor-${i}` as PhotoSlot, p)}
          />
        </>
      ),
    });
  });

  const startWallName =
    runs.length === 1 ? 'Left wall' : `Wall at the open end of the ${labels[0].toLowerCase()}`;
  const endWallName =
    runs.length === 1
      ? 'Right wall'
      : `Wall at the end of the ${labels[labels.length - 1].toLowerCase()}`;

  cards.push({
    title: 'Which wall leans, and by how much?',
    body: (
      <>
        <div className="space-y-1.5">
          <Label className="text-sm">How did you check?</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => patch({ method: method.id, shapeConfirmed: false })}
                className={`rounded border p-3 text-left transition-colors ${
                  m.method === method.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-muted-foreground/40'
                }`}
              >
                <div className="text-sm font-medium">{method.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{method.blurb}</div>
              </button>
            ))}
          </div>
        </div>

        {/* The drawing follows the choice. Showing all three at once is a lot
            of scroll on a phone, and only one of them is what they are about
            to do. Before they choose, show the most likely. */}
        <div className="sm:max-w-sm">
          <Figure figure={METHODS.find((x) => x.id === m.method)?.figure ?? 'wall-packers'} />
        </div>

        {m.method && m.method !== 'assumed-square' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {ctx.hasStartWall && (
              <WallGaps
                name={startWallName}
                wall={m.startWall}
                onChange={(p) => patchWall('startWall', p)}
              />
            )}
            {ctx.hasEndWall && (
              <WallGaps
                name={endWallName}
                wall={m.endWall}
                onChange={(p) => patchWall('endWall', p)}
              />
            )}
          </div>
        )}

        {runs.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Only the two ends of the whole enclosure meet a wall — the corner between them is
            glass against glass, which sets its own vertical, so there is nothing to check there.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Measure from the line, or from the edge of the level, straight across to the wall. If
          one end touches, that reading is 0. It is the difference between the two we need, not
          whether the wall itself is flat.
        </p>

        {/* The payoff from the readings, shown where they were taken: this is
            the number that would otherwise have sent someone up a ladder. */}
        {runs.some((_, i) => wallsForRun(m, i, ctx).some(wallMeasured)) && (
          <div className="rounded bg-muted/60 px-3 py-2 text-xs">
            <div className="font-medium">That gives us the width at the top:</div>
            <ul className="mt-1 space-y-0.5">
              {runs.map((run, i) => (
                <li key={i}>
                  {runs.length > 1 ? `${labels[i]}: ` : ''}
                  <strong>{topWidthMm(m, i, ctx)}mm</strong> at the top, from{' '}
                  {run.widthAtFloorMm}mm at the floor.
                </li>
              ))}
            </ul>
          </div>
        )}

        <PhotoCapture
          slot="walls"
          prompt="Show the level or laser against the wall, with the gap visible."
          photo={photoFor('walls')}
          onChange={(p) => setPhotoFor('walls', p)}
        />
      </>
    ),
  });

  cards.push({
    title: 'Is the floor level?',
    figure: 'floor-level',
    body: (
      <>
        {runs.map((run, i) => (
          <div key={i} className="space-y-2 rounded border p-3">
            {runs.length > 1 && (
              <Label className="text-sm font-medium">Along the {labels[i].toLowerCase()}</Label>
            )}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="numeric"
                className="w-24"
                value={run.floorFallMm}
                onChange={(e) =>
                  patchRun(i, { floorFallMm: Math.max(0, parseInt(e.target.value, 10) || 0) })
                }
              />
              <span className="text-sm text-muted-foreground">mm of fall</span>
            </div>
            {run.floorFallMm > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Which end is lower?</Label>
                <div className="flex gap-2">
                  {(
                    [
                      ['start', runs.length > 1 && i > 0 ? 'Corner end' : 'Left'],
                      ['end', runs.length > 1 && i < runs.length - 1 ? 'Corner end' : 'Right'],
                    ] as const
                  ).map(([end, label]) => (
                    <Button
                      key={end}
                      size="sm"
                      variant={run.floorLowEnd === end ? 'default' : 'outline'}
                      onClick={() => patchRun(i, { floorLowEnd: end })}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <PhotoCapture
          slot="floor"
          prompt="Show the level across the floor, with any gap underneath it."
          photo={photoFor('floor')}
          onChange={(p) => setPhotoFor('floor', p)}
        />
      </>
    ),
  });

  cards.push({
    title:
      runs.length > 1 ? 'Do these look like your bathroom?' : 'Does this look like your bathroom?',
    body: anyBlocking ? (
      <div className="sm:col-span-2">
        <p className="text-sm text-muted-foreground">
          We cannot draw your opening yet — go back and sort the problem above first.
        </p>
      </div>
    ) : (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {runs.map((run, i) => {
            const bounding = wallsForRun(m, i, ctx);
            const startLean =
              i === 0 && ctx.hasStartWall ? signedLeanMm(m.startWall) : 0;
            const endLean =
              i === runs.length - 1 && ctx.hasEndWall ? signedLeanMm(m.endWall) : 0;
            return (
              <figure key={i} className="space-y-1">
                <OpeningPreview
                  widthAtFloorMm={run.widthAtFloorMm}
                  widthAtTopMm={topWidthMm(m, i, ctx)}
                  heightMm={state.heightMm}
                  leftLeanMm={startLean}
                  rightLeanMm={endLean}
                  floorFallMm={run.floorFallMm}
                  floorLowEnd={
                    run.floorLowEnd === 'start'
                      ? 'left'
                      : run.floorLowEnd === 'end'
                        ? 'right'
                        : null
                  }
                  className="w-full rounded bg-muted/40 p-2"
                />
                {runs.length > 1 && (
                  <figcaption className="text-xs font-medium text-muted-foreground">
                    {labels[i]}
                    {bounding.length === 0 ? ' (glass both ends)' : ''}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
        <label className="flex cursor-pointer gap-3 rounded border p-3 sm:col-span-2">
          <Checkbox
            checked={m.shapeConfirmed}
            onCheckedChange={(v) => patch({ shapeConfirmed: v === true })}
            className="mt-0.5"
          />
          <span className="text-sm">
            Yes — {runs.length > 1 ? 'those are' : 'that is'} the right shape, and the walls lean
            the way shown.
          </span>
        </label>
        <p className="text-xs text-muted-foreground sm:col-span-2">
          The lean is drawn much larger than it really is so you can see which way it goes. The
          dashed line is what a perfectly square opening would look like.
        </p>
      </>
    ),
  });

  if (!isMobile) {
    return (
      <div className="space-y-5">
        {intro}
        {cards.slice(0, -1).map((card, i) => (
          <Measurement key={card.title} number={i + 1} {...card}>
            {card.body}
          </Measurement>
        ))}
        {alerts}
        {!anyBlocking && (
          <Measurement number={cards.length} title={cards[cards.length - 1].title}>
            {cards[cards.length - 1].body}
          </Measurement>
        )}
      </div>
    );
  }

  return (
    <MobileCards
      topRef={topRef}
      intro={intro}
      alerts={alerts}
      card={cards[cardIndex]}
      cardIndex={cardIndex}
      total={cards.length}
      isFinal={cardIndex === cards.length - 1}
      done={!anyBlocking && m.shapeConfirmed}
    />
  );
}

/**
 * The phone layout: one measurement per screen.
 *
 * Navigation is the shell's existing Back/Next, not a second pair inside the
 * card. Two sets of buttons on a phone is one set too many, and the inner
 * pair ended up underneath the sticky bar carrying the outer one.
 *
 * Kept as its own component so the hook that scrolls back to the top on each
 * card runs unconditionally — the desktop branch returns before this point,
 * and a hook behind that early return would break the rules of hooks.
 */
function MobileCards({
  topRef,
  intro,
  alerts,
  card,
  cardIndex,
  total,
  isFinal,
  done,
}: {
  topRef: React.RefObject<HTMLDivElement>;
  intro: JSX.Element;
  alerts: JSX.Element;
  card: { title: string; figure?: MeasureFigure; help?: string; body: JSX.Element };
  cardIndex: number;
  total: number;
  isFinal: boolean;
  done: boolean;
}) {
  // A new measurement should start at its own heading, not wherever the last
  // one left the page.
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [cardIndex, topRef]);

  return (
    <div ref={topRef} className="space-y-4">
      {cardIndex === 0 && intro}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Measurement {cardIndex + 1} of {total}
          </span>
          {done && (
            <span className="flex items-center gap-1 text-primary">
              <Check className="h-3.5 w-3.5" />
              All done
            </span>
          )}
        </div>
        {/* A plain bar rather than numbered dots: that many tap targets across
            a phone are too small to hit, and nobody jumps to measurement four. */}
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((cardIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <Measurement number={cardIndex + 1} title={card.title} figure={card.figure} help={card.help}>
        {card.body}
      </Measurement>

      {alerts}

      {isFinal && (
        <p className="text-xs text-muted-foreground">
          That is the measuring done — tap Next to carry on.
        </p>
      )}
    </div>
  );
}

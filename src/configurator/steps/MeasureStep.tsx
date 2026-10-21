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
  wallsForRun,
  type MeasureMethod,
  type OpeningMeasurements,
  type RunMeasurement,
  type WallLeanDirection,
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

/** Lean amount plus direction for one wall. Both are required together. */
function WallLean({
  name,
  wall,
  onChange,
}: {
  name: string;
  wall: WallMeasurement;
  onChange: (patch: Partial<WallMeasurement>) => void;
}) {
  return (
    <div className="space-y-2 rounded border p-3">
      <Label className="text-sm font-medium">{name}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          className="w-24"
          value={wall.outMm}
          onChange={(e) => onChange({ outMm: Math.max(0, parseInt(e.target.value, 10) || 0) })}
        />
        <span className="text-sm text-muted-foreground">mm out of plumb</span>
      </div>
      {wall.outMm > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            At the top, which way does it lean?
          </Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['in', 'Into the shower'],
                ['out', 'Away from the shower'],
              ] as [WallLeanDirection, string][]
            ).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={wall.direction === id ? 'default' : 'outline'}
                onClick={() => onChange({ direction: id })}
              >
                {label}
              </Button>
            ))}
          </div>
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
  return 4 + 2 * Math.max(1, runCount);
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
  const setRunFloorWidth = (i: number, widthMm: number) => {
    const run = runs[i];
    update({
      panels: scaleRunPanels(state.panels, runIndices[i] ?? [], widthMm),
      opening: {
        ...m,
        runs: runs.map((r, j) =>
          j === i
            ? {
                ...r,
                widthAtFloorMm: widthMm,
                // Carry the top width along by the same amount. The run starts
                // out square, so typing 1000 at the floor should leave it
                // square rather than reading as a lean against a default the
                // customer never entered. Any difference already recorded
                // survives.
                widthAtTopMm: Math.max(0, r.widthAtTopMm + (widthMm - run.widthAtFloorMm)),
              }
            : r
        ),
        shapeConfirmed: false,
      },
    });
  };

  const patchWall = (key: 'startWall' | 'endWall', p: Partial<WallMeasurement>) =>
    patch({ [key]: { ...m[key], ...p }, shapeConfirmed: false } as Partial<OpeningMeasurements>);

  const photoFor = (slot: PhotoSlot) => photos.find((p) => p.slot === slot);
  const setPhotoFor = (slot: PhotoSlot, photo: Photo | null) => {
    const rest = photos.filter((p) => p.slot !== slot);
    setPhotos(photo ? [...rest, photo] : rest);
  };

  const allChecks = checkMeasurements(m, ctx);

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
          It takes about ten minutes.
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
              <p key={c.code} className="text-red-800 dark:text-red-300">
                {c.message}
              </p>
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
          <PhotoCapture
            slot={`width-floor-${i}` as PhotoSlot}
            prompt="Show the tape flat on the floor, with both ends in place."
            photo={photoFor(`width-floor-${i}` as PhotoSlot)}
            onChange={(p) => setPhotoFor(`width-floor-${i}` as PhotoSlot, p)}
          />
        </>
      ),
    });

    cards.push({
      title: `Width at the top${runPhrase(i)}`,
      figure: 'width-top',
      help: wallsForRun(m, i, ctx).length
        ? 'If this differs from the floor width, the wall leans — which is normal, and we cut the glass to follow it.'
        : 'Both ends of this run meet glass rather than a wall, so it should come out the same as the floor width.',
      body: (
        <>
          <Label htmlFor={`w-top-${i}`}>Width at the top (mm)</Label>
          <Input
            id={`w-top-${i}`}
            type="number"
            inputMode="numeric"
            value={run.widthAtTopMm}
            onChange={(e) =>
              patchRun(i, { widthAtTopMm: parseInt(e.target.value, 10) || 0 })
            }
          />
          {run.widthAtFloorMm > 0 &&
            run.widthAtTopMm > 0 &&
            run.widthAtFloorMm !== run.widthAtTopMm && (
              <p className="rounded bg-muted/60 px-3 py-2 text-xs">
                This run is <strong>{Math.abs(run.widthAtFloorMm - run.widthAtTopMm)}mm</strong>{' '}
                {run.widthAtTopMm < run.widthAtFloorMm ? 'narrower' : 'wider'} at the top. The
                wall card works out which wall is responsible.
              </p>
            )}
          <PhotoCapture
            slot={`width-top-${i}` as PhotoSlot}
            prompt="Same again, with the tape at the height the glass will reach."
            photo={photoFor(`width-top-${i}` as PhotoSlot)}
            onChange={(p) => setPhotoFor(`width-top-${i}` as PhotoSlot, p)}
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
              <WallLean
                name={startWallName}
                wall={m.startWall}
                onChange={(p) => patchWall('startWall', p)}
              />
            )}
            {ctx.hasEndWall && (
              <WallLean
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
          If a wall is straight but the whole thing is off vertical, that still counts — it is
          the difference between top and bottom we need, not whether the wall itself is flat.
        </p>

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
                  widthAtTopMm={run.widthAtTopMm}
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

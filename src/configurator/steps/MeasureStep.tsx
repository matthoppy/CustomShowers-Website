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
  signedLeanMm,
  type MeasureMethod,
  type OpeningMeasurements,
  type WallLeanDirection,
} from '../measure';
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
  wall: OpeningMeasurements['leftWall'];
  onChange: (patch: Partial<OpeningMeasurements['leftWall']>) => void;
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
 * Spread a new overall width across the existing panels, keeping their
 * proportions. The rounding remainder goes on the widest panel, where a
 * millimetre matters least — the alternative is a run that does not add up
 * to the opening it is supposed to fill.
 */
function scalePanelsToWidth(
  panels: ConfiguratorPanel[],
  targetMm: number
): ConfiguratorPanel[] {
  const total = panels.reduce((s, p) => s + p.width_mm, 0);
  if (total <= 0 || targetMm <= 0) return panels;

  const scaled = panels.map((p) => ({
    ...p,
    width_mm: Math.max(1, Math.round((p.width_mm / total) * targetMm)),
  }));

  const drift = targetMm - scaled.reduce((s, p) => s + p.width_mm, 0);
  if (drift !== 0) {
    let widest = 0;
    scaled.forEach((p, i) => {
      if (p.width_mm > scaled[widest].width_mm) widest = i;
    });
    scaled[widest] = { ...scaled[widest], width_mm: scaled[widest].width_mm + drift };
  }
  return scaled;
}

/**
 * How many cards the phone layout walks through.
 *
 * The shell drives them with its own Next button rather than the step
 * growing a second pair, so it needs to know how many there are.
 */
export const MEASURE_CARD_COUNT = 6;

/**
 * Which card a given check becomes answerable on.
 *
 * On a phone the customer sees one measurement at a time, so a check is only
 * worth raising once they have been shown the card that produces it. Telling
 * someone on the floor-width card that they have not said how they checked
 * the walls is noise about a question they have not been asked yet — and
 * noise is how a real contradiction gets scrolled past.
 */
function checkCardIndex(code: string): number {
  if (code.startsWith('widthAtFloorMm')) return 1;
  if (code.startsWith('widthAtTopMm')) return 2;
  if (code === 'cross-check-mismatch') return 3;
  if (code.startsWith('leftWall') || code.startsWith('rightWall')) return 3;
  if (code === 'no-method' || code === 'assumed-square') return 3;
  if (code.startsWith('floor-')) return 4;
  if (code === 'shape-unconfirmed') return 5;
  return 0;
}

export function MeasureStep({ state, update, photos, setPhotos, measureCard }: StepProps) {
  const m = state.opening;
  const isMobile = useIsMobile();
  const cardIndex = Math.min(measureCard ?? 0, MEASURE_CARD_COUNT - 1);
  const topRef = useRef<HTMLDivElement>(null);

  const patch = (p: Partial<OpeningMeasurements>) => update({ opening: { ...m, ...p } });

  /**
   * The width at the floor is the opening, so the panels have to follow it.
   * Without this the customer measures 1000mm and then sees a drawing of the
   * template's default 700mm run, which reads as the tool ignoring them.
   */
  const setFloorWidth = (widthMm: number) =>
    update({
      panels: scalePanelsToWidth(state.panels, widthMm),
      opening: {
        ...m,
        widthAtFloorMm: widthMm,
        // Carry the top width along by the same amount. The opening starts
        // out square, so typing 1000 at the floor should leave it square
        // rather than reading as a 300mm lean against a default the customer
        // never entered. Any difference they have already recorded survives.
        widthAtTopMm: Math.max(0, m.widthAtTopMm + (widthMm - m.widthAtFloorMm)),
        shapeConfirmed: false,
      },
    });

  const patchWall = (
    key: 'leftWall' | 'rightWall',
    p: Partial<OpeningMeasurements['leftWall']>
  ) => patch({ [key]: { ...m[key], ...p }, shapeConfirmed: false } as Partial<OpeningMeasurements>);

  const photoFor = (slot: PhotoSlot) => photos.find((p) => p.slot === slot);
  const setPhotoFor = (slot: PhotoSlot, photo: Photo | null) => {
    const rest = photos.filter((p) => p.slot !== slot);
    setPhotos(photo ? [...rest, photo] : rest);
  };

  const allChecks = checkMeasurements(m, state.heightMm);
  // Desktop shows the lot: every card is on screen, so every check is about
  // something the customer can see.
  const checks = isMobile
    ? allChecks.filter((c) => checkCardIndex(c.code) <= cardIndex)
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

  /**
   * One definition per measurement, rendered either stacked (desktop) or one
   * at a time (phone). Describing them twice is how the two drift apart.
   */
  const cards: { title: string; figure?: MeasureFigure; help?: string; body: JSX.Element }[] = [
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
    {
      title: 'Width across the opening, at the floor',
      figure: 'width-floor',
      help: 'Measure to the tiles or finished surface, not to the plaster behind them.',
      body: (
        <>
          <Label htmlFor="w-floor">Width at the floor (mm)</Label>
          <Input
            id="w-floor"
            type="number"
            inputMode="numeric"
            value={m.widthAtFloorMm}
            onChange={(e) => setFloorWidth(parseInt(e.target.value, 10) || 0)}
          />
          <PhotoCapture
            slot="width-floor"
            prompt="Show the tape flat on the floor, with both ends against the walls."
            photo={photoFor('width-floor')}
            onChange={(p) => setPhotoFor('width-floor', p)}
          />
        </>
      ),
    },
    {
      title: 'Width again, at the top of the glass',
      figure: 'width-top',
      help: 'If this differs from the floor width, your walls lean — which is normal, and we cut the glass to follow it.',
      body: (
        <>
          <Label htmlFor="w-top">Width at the top (mm)</Label>
          <Input
            id="w-top"
            type="number"
            inputMode="numeric"
            value={m.widthAtTopMm}
            onChange={(e) =>
              patch({ widthAtTopMm: parseInt(e.target.value, 10) || 0, shapeConfirmed: false })
            }
          />
          {m.widthAtFloorMm > 0 && m.widthAtTopMm > 0 && m.widthAtFloorMm !== m.widthAtTopMm && (
            <p className="rounded bg-muted/60 px-3 py-2 text-xs">
              Your opening is <strong>{Math.abs(m.widthAtFloorMm - m.widthAtTopMm)}mm</strong>{' '}
              {m.widthAtTopMm < m.widthAtFloorMm ? 'narrower' : 'wider'} at the top. The next
              step works out which wall is responsible.
            </p>
          )}
          <PhotoCapture
            slot="width-top"
            prompt="Same again, with the tape at the height the glass will reach."
            photo={photoFor('width-top')}
            onChange={(p) => setPhotoFor('width-top', p)}
          />
        </>
      ),
    },
    {
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

          {/* The drawing follows the choice. Showing all three at once is a
              lot of scroll on a phone, and only one of them is what they are
              about to do. Before they choose, show the most likely. */}
          <div className="sm:max-w-sm">
            <Figure figure={METHODS.find((x) => x.id === m.method)?.figure ?? 'wall-packers'} />
          </div>

          {m.method && m.method !== 'assumed-square' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <WallLean
                name="Left wall"
                wall={m.leftWall}
                onChange={(p) => patchWall('leftWall', p)}
              />
              <WallLean
                name="Right wall"
                wall={m.rightWall}
                onChange={(p) => patchWall('rightWall', p)}
              />
            </div>
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
    },
    {
      title: 'Is the floor level?',
      figure: 'floor-level',
      body: (
        <>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              className="w-24"
              value={m.floor.fallMm}
              onChange={(e) =>
                patch({
                  floor: { ...m.floor, fallMm: Math.max(0, parseInt(e.target.value, 10) || 0) },
                  shapeConfirmed: false,
                })
              }
            />
            <span className="text-sm text-muted-foreground">mm of fall across the opening</span>
          </div>
          {m.floor.fallMm > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Which end is lower?</Label>
              <div className="flex gap-2">
                {(['left', 'right'] as const).map((end) => (
                  <Button
                    key={end}
                    size="sm"
                    variant={m.floor.lowEnd === end ? 'default' : 'outline'}
                    onClick={() =>
                      patch({ floor: { ...m.floor, lowEnd: end }, shapeConfirmed: false })
                    }
                  >
                    {end === 'left' ? 'Left' : 'Right'}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <PhotoCapture
            slot="floor"
            prompt="Show the level across the floor, with any gap underneath it."
            photo={photoFor('floor')}
            onChange={(p) => setPhotoFor('floor', p)}
          />
        </>
      ),
    },
    {
      title: 'Does this look like your bathroom?',
      body:
        anyBlocking ? (
          <div className="sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              We cannot draw your opening yet — go back and sort the problem above first.
            </p>
          </div>
        ) : (
          <>
            <OpeningPreview
              widthAtFloorMm={m.widthAtFloorMm}
              widthAtTopMm={m.widthAtTopMm}
              heightMm={state.heightMm}
              leftLeanMm={signedLeanMm(m.leftWall)}
              rightLeanMm={signedLeanMm(m.rightWall)}
              floorFallMm={m.floor.fallMm}
              floorLowEnd={m.floor.lowEnd}
              className="w-full rounded bg-muted/40 p-2"
            />
            <label className="flex cursor-pointer gap-3 rounded border p-3">
              <Checkbox
                checked={m.shapeConfirmed}
                onCheckedChange={(v) => patch({ shapeConfirmed: v === true })}
                className="mt-0.5"
              />
              <span className="text-sm">
                Yes — that is the right shape, and the walls lean the way shown.
              </span>
            </label>
            <p className="text-xs text-muted-foreground">
              The lean is drawn much larger than it really is so you can see which way it goes.
              The dashed line is what a perfectly square opening would look like.
            </p>
          </>
        ),
    },
  ];

  if (!isMobile) {
    return (
      <div className="space-y-5">
        {intro}
        {cards.slice(0, 5).map((card, i) => (
          <Measurement key={card.title} number={i + 1} {...card}>
            {card.body}
          </Measurement>
        ))}
        {alerts}
        {!anyBlocking && (
          <Measurement number={6} title={cards[5].title}>
            {cards[5].body}
          </Measurement>
        )}
      </div>
    );
  }

  // --- Phone: one measurement per screen. ---
  const card = cards[cardIndex];
  const isFinal = cardIndex === cards.length - 1;

  return (
    <MobileCards
      topRef={topRef}
      intro={intro}
      alerts={alerts}
      card={card}
      cardIndex={cardIndex}
      total={cards.length}
      isFinal={isFinal}
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
        {/* A plain bar rather than numbered dots: six tap targets across a
            phone are too small to hit, and nobody jumps to measurement four. */}
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

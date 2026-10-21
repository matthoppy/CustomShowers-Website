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

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Info } from 'lucide-react';
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

const METHODS: { id: MeasureMethod; label: string; blurb: string }[] = [
  {
    id: 'laser',
    label: 'Laser line',
    blurb: 'A self-levelling laser gives a true vertical to measure the wall against. The most accurate way, and the one we recommend.',
  },
  {
    id: 'packers',
    label: 'Laser and packers',
    blurb: 'Same laser line, but instead of reading a tape you slide glazing packers into the gap until snug and add up what you used. Easier to get right.',
  },
  {
    id: 'level',
    label: 'Spirit level',
    blurb: 'A long level held against the wall. Works, but the longer the level the better — a short one on a tall wall will miss a gentle lean.',
  },
  {
    id: 'assumed-square',
    label: "Haven't checked",
    blurb: 'You can send it like this, but we will cut to square — and if the walls are not, the gaps will show.',
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

export function MeasureStep({ state, update }: StepProps) {
  const m = state.opening;
  const patch = (p: Partial<OpeningMeasurements>) => update({ opening: { ...m, ...p } });

  /**
   * The width at the floor is the opening, so the panels have to follow it.
   * Without this the customer measures 1000mm and then sees a drawing of the
   * template's default 700mm run, which reads as the tool ignoring them.
   */
  const setFloorWidth = (widthMm: number) =>
    update({
      panels: scalePanelsToWidth(state.panels, widthMm),
      opening: { ...m, widthAtFloorMm: widthMm, shapeConfirmed: false },
    });

  const patchWall = (
    key: 'leftWall' | 'rightWall',
    p: Partial<OpeningMeasurements['leftWall']>
  ) => patch({ [key]: { ...m[key], ...p }, shapeConfirmed: false } as Partial<OpeningMeasurements>);

  const checks = checkMeasurements(m, state.heightMm);
  const blocking = checks.filter((c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed');
  const confirms = checks.filter((c) => c.level === 'confirm');

  return (
    <div className="space-y-5">
      {/* What they are about to do, and why it matters. Said once, plainly,
          before anyone types a number. */}
      <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-2 text-sm">
          <p className="font-semibold">We cut the glass to these numbers.</p>
          <p className="text-muted-foreground">
            Toughened glass cannot be trimmed once it is made, so take your time over this part.
            You will need a tape measure, and ideally a laser level or a spirit level to check
            the walls. It takes about ten minutes.
          </p>
          <p className="text-muted-foreground">
            Every measurement below is in <strong>millimetres</strong> — a 1.4 metre opening is
            1400.
          </p>
        </div>
      </div>

      <Measurement
        number={1}
        title="How tall should the glass be?"
        figure="height"
        help="Most enclosures are 2000–2100mm. A screen over a bath is usually around 1500mm."
      >
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
      </Measurement>

      <Measurement
        number={2}
        title="Width across the opening, at the floor"
        figure="width-floor"
        help="Measure to the tiles or finished surface, not to the plaster behind them."
      >
        <Label htmlFor="w-floor">Width at the floor (mm)</Label>
        <Input
          id="w-floor"
          type="number"
          inputMode="numeric"
          value={m.widthAtFloorMm}
          onChange={(e) => setFloorWidth(parseInt(e.target.value, 10) || 0)}
        />
      </Measurement>

      <Measurement
        number={3}
        title="Width again, at the top of the glass"
        figure="width-top"
        help="If this differs from the floor width, your walls lean — which is normal, and we cut the glass to follow it."
      >
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
            {m.widthAtTopMm < m.widthAtFloorMm ? 'narrower' : 'wider'} at the top. Step 4 works
            out which wall is responsible.
          </p>
        )}
      </Measurement>

      <Measurement number={4} title="Which wall leans, and by how much?">
        <div className="grid gap-4 sm:grid-cols-2">
          <Figure figure="wall-laser" />
          <Figure figure="wall-packers" />
        </div>

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

        {m.method && m.method !== 'assumed-square' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <WallLean name="Left wall" wall={m.leftWall} onChange={(p) => patchWall('leftWall', p)} />
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
      </Measurement>

      <Measurement
        number={5}
        title="Is the floor level?"
        figure="floor-level"
      >
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
      </Measurement>

      {/* Problems first, because there is no point confirming a shape built
          from numbers that contradict each other. */}
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

      {/* The last gate. Arithmetic cannot catch a lean recorded on the wrong
          wall; a picture can. */}
      {blocking.length === 0 && (
        <Measurement number={6} title="Does this look like your bathroom?">
          <OpeningPreview
            widthAtFloorMm={m.widthAtFloorMm}
            widthAtTopMm={m.widthAtTopMm}
            heightMm={state.heightMm}
            leftLeanMm={signedLeanMm(m.leftWall)}
            rightLeanMm={signedLeanMm(m.rightWall)}
            floorFallMm={m.floor.fallMm}
            floorLowEnd={m.floor.lowEnd}
            className="w-full rounded bg-muted/40 p-2 sm:col-span-2"
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
        </Measurement>
      )}
    </div>
  );
}

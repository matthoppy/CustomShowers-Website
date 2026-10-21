/**
 * The survey, done by the customer.
 *
 * Custom Showers does not visit before cutting. The numbers typed into this
 * configurator are the numbers the glass is made to, and toughened glass
 * cannot be trimmed afterwards — so a measurement that is 5mm out is a new
 * panel, not an adjustment.
 *
 * Two ideas run through this module, and both exist because the person
 * holding the tape is standing in their own bathroom and has never done this
 * before:
 *
 * 1. Never ask them to *judge* whether something is out of true. People are
 *    bad at it and confident about it. Ask them to measure the same opening
 *    in two places, and derive the lean from the difference.
 *
 * 2. Cross-check everything against everything else. A run's floor width, its
 *    top width and the lean of the walls at its ends are not independent —
 *    they have to add up. When they don't, one of them is wrong, and we can
 *    say so while it is still free to fix.
 *
 * The second is the whole point. Any form can collect four numbers; this one
 * can tell the customer that their four numbers disagree.
 *
 * ## Runs
 *
 * An enclosure is measured as one straight *run* per wall it follows: an
 * inline screen is one run, an L-shaped corner is two, a three-sided
 * enclosure is three. Each run gets its own widths and its own floor fall,
 * because a corner shower turns into a different room halfway along.
 *
 * Only the two ends of the whole chain meet walls. Every other end is a
 * glass-to-glass corner, and glass sets its own vertical there — so a middle
 * run's top width should equal its floor width.
 */

/** Which way the top of a wall leans, from the point of view of the shower. */
export type WallLeanDirection = 'in' | 'out';

/** Which end of a run the floor is lower at, walking along it. */
export type FloorLowEnd = 'start' | 'end';

/** How the customer established the lean. Changes how far we trust it. */
export type MeasureMethod = 'laser' | 'packers' | 'level' | 'assumed-square';

export interface WallMeasurement {
  /** How far out of plumb, in mm over the glass height. 0 = plumb. */
  outMm: number;
  /**
   * Which way the top leans. Null means they have not answered yet, which is
   * different from "straight" and must not be treated as zero.
   */
  direction: WallLeanDirection | null;
}

export interface RunMeasurement {
  /** Wall (or corner) to wall (or corner), measured along the floor. */
  widthAtFloorMm: number;
  /** The same, at the top of where the glass will go. */
  widthAtTopMm: number;
  /** Difference in floor height along this run. 0 = level. */
  floorFallMm: number;
  floorLowEnd: FloorLowEnd | null;
}

export interface OpeningMeasurements {
  /** One per straight run, in chain order. */
  runs: RunMeasurement[];
  /** The wall at the start of the first run. */
  startWall: WallMeasurement;
  /** The wall at the end of the last run. */
  endWall: WallMeasurement;
  method: MeasureMethod | null;
  /** Set once the customer has confirmed the drawn-back shape looks right. */
  shapeConfirmed: boolean;
}

/** What the shape of the enclosure tells us about the measurements. */
export interface OpeningContext {
  /** Does the first run terminate against a wall? */
  hasStartWall: boolean;
  /** Does the last run terminate against a wall? */
  hasEndWall: boolean;
  glassHeightMm: number;
  /**
   * What to call each run. Supplied by the caller because the right name
   * comes from the traced geometry, not from the order the panels happen to
   * be listed in.
   */
  labels?: string[];
}

function createRun(widthMm: number): RunMeasurement {
  return {
    widthAtFloorMm: widthMm,
    widthAtTopMm: widthMm,
    floorFallMm: 0,
    floorLowEnd: null,
  };
}

export function createOpeningMeasurements(runWidthsMm: number[] = [1000]): OpeningMeasurements {
  return {
    runs: runWidthsMm.map(createRun),
    startWall: { outMm: 0, direction: null },
    endWall: { outMm: 0, direction: null },
    method: null,
    shapeConfirmed: false,
  };
}

/**
 * Keep the runs in step with the shape.
 *
 * Changing the template, adding a panel or turning a junction into a corner
 * all change how many runs there are. Measurements already taken for a run
 * are kept by position — the alternative is silently discarding what the
 * customer walked to the bathroom to collect.
 */
export function syncRuns(
  m: OpeningMeasurements,
  runWidthsMm: number[]
): OpeningMeasurements {
  if (runWidthsMm.length === m.runs.length) return m;
  return {
    ...m,
    runs: runWidthsMm.map((widthMm, i) => m.runs[i] ?? createRun(widthMm)),
    // The shape has changed under them, so the confirmation no longer refers
    // to what they are now looking at.
    shapeConfirmed: false,
  };
}

/** Names a customer would use for each run, given how many there are. */
export function runLabels(count: number): string[] {
  if (count <= 1) return ['The opening'];
  if (count === 2) return ['Front', 'Return'];
  if (count === 3) return ['Left return', 'Front', 'Right return'];
  return Array.from({ length: count }, (_, i) => `Run ${i + 1}`);
}

/**
 * A wall's lean as a signed number, positive when it eats into the opening.
 *
 * A wall leaning *in* at the top makes the opening narrower at the top, so it
 * subtracts from the top width. Leaning *out* widens it. Getting this sign
 * wrong puts a panel out by twice the lean rather than by nothing, which is
 * why direction is a required answer rather than an optional refinement.
 */
export function signedLeanMm(wall: WallMeasurement): number {
  if (!wall.direction || !wall.outMm) return 0;
  return wall.direction === 'in' ? wall.outMm : -wall.outMm;
}

/** Which walls, if any, bound a given run. Corners are not walls. */
export function wallsForRun(
  m: OpeningMeasurements,
  runIndex: number,
  ctx: OpeningContext
): WallMeasurement[] {
  const walls: WallMeasurement[] = [];
  if (runIndex === 0 && ctx.hasStartWall) walls.push(m.startWall);
  if (runIndex === m.runs.length - 1 && ctx.hasEndWall) walls.push(m.endWall);
  return walls;
}

/** The top width implied by a run's floor width and the walls at its ends. */
export function impliedTopWidthMm(
  m: OpeningMeasurements,
  runIndex: number,
  ctx: OpeningContext
): number {
  const run = m.runs[runIndex];
  if (!run) return 0;
  return (
    run.widthAtFloorMm -
    wallsForRun(m, runIndex, ctx).reduce((sum, w) => sum + signedLeanMm(w), 0)
  );
}

export type CheckLevel = 'blocking' | 'confirm' | 'hint';

export interface MeasureCheck {
  code: string;
  level: CheckLevel;
  /** Addressed to the customer, in their words, saying what to do about it. */
  message: string;
  /** Which run the check is about, where it is about one. */
  runIndex?: number;
}

/** Anything outside this is a typo or the wrong units, not a bathroom. */
const MIN_PLAUSIBLE_MM = 400;
const MAX_PLAUSIBLE_MM = 3000;

/**
 * How far the cross-check may disagree before we stop the customer.
 *
 * 3mm is roughly the best a careful amateur does with a tape over a metre,
 * and it is also small enough that a panel cut to it still fits. Beyond that
 * the numbers are telling us something real.
 */
const CROSS_CHECK_TOLERANCE_MM = 3;

/**
 * An out-of-plumb wall past this is unusual enough to be worth a second look.
 * Real bathrooms do manage it, so this asks rather than blocks.
 */
const LARGE_LEAN_MM = 20;

export function checkMeasurements(
  m: OpeningMeasurements,
  ctx: OpeningContext
): MeasureCheck[] {
  const checks: MeasureCheck[] = [];
  const labels = ctx.labels ?? runLabels(m.runs.length);
  const named = (i: number) => (m.runs.length > 1 ? `${labels[i].toLowerCase()} ` : '');

  // --- Plausibility, before anything is derived from the numbers. ---
  m.runs.forEach((run, i) => {
    for (const [key, value, name] of [
      ['widthAtFloor', run.widthAtFloorMm, `${named(i)}width at the floor`],
      ['widthAtTop', run.widthAtTopMm, `${named(i)}width at the top`],
    ] as const) {
      if (!value) {
        checks.push({
          code: `run${i}-${key}-missing`,
          level: 'blocking',
          message: `We still need the ${name}.`,
          runIndex: i,
        });
      } else if (value < MIN_PLAUSIBLE_MM || value > MAX_PLAUSIBLE_MM) {
        checks.push({
          code: `run${i}-${key}-implausible`,
          level: 'blocking',
          message: `${value}mm for the ${name} looks wrong — we need millimetres, so a 1.4 metre opening is 1400. Please check and re-measure.`,
          runIndex: i,
        });
      }
    }
  });

  // Nothing below this point means anything if the widths are nonsense.
  if (checks.some((c) => c.level === 'blocking')) return checks;

  // --- Direction is not optional. ---
  const walls: [string, WallMeasurement, string][] = [];
  if (ctx.hasStartWall) walls.push(['startWall', m.startWall, 'first wall']);
  if (ctx.hasEndWall) walls.push(['endWall', m.endWall, 'far wall']);

  for (const [key, wall, name] of walls) {
    if (wall.outMm > 0 && !wall.direction) {
      checks.push({
        code: `${key}-no-direction`,
        level: 'blocking',
        message: `You have told us the ${name} is ${wall.outMm}mm out, but not which way it leans. Without that we would cut the panel the wrong shape — it matters as much as the measurement itself.`,
      });
    }
    if (wall.outMm > LARGE_LEAN_MM) {
      checks.push({
        code: `${key}-large-lean`,
        level: 'confirm',
        message: `${wall.outMm}mm is a lot of lean on the ${name} over ${ctx.glassHeightMm}mm of height. It does happen — but please double-check it before you send, because we will cut the glass to follow it.`,
      });
    }
  }

  // --- The cross-check, per run. ---
  m.runs.forEach((run, i) => {
    const implied = impliedTopWidthMm(m, i, ctx);
    const discrepancy = Math.round(run.widthAtTopMm - implied);
    if (Math.abs(discrepancy) <= CROSS_CHECK_TOLERANCE_MM) return;

    const bounding = wallsForRun(m, i, ctx);
    const leanTotal = bounding.reduce((sum, w) => sum + signedLeanMm(w), 0);
    const widthDrop = run.widthAtFloorMm - run.widthAtTopMm;
    const where = m.runs.length > 1 ? ` on the ${labels[i].toLowerCase()}` : '';

    checks.push({
      code: `run${i}-cross-check-mismatch`,
      level: 'blocking',
      runIndex: i,
      message: bounding.length
        ? `These numbers do not agree with each other${where}. It narrows by ${widthDrop}mm ` +
          `between the floor and the top, but the wall leans you have given add up to ${leanTotal}mm. ` +
          `One of them is out by about ${Math.abs(discrepancy)}mm. Please re-check the width at ` +
          `the top and the wall leans — this is exactly the kind of mistake that ends up as a ` +
          `panel that does not fit.`
        : `The measurements${where} do not agree. Both ends of this run meet glass rather than ` +
          `a wall, so it should be the same width at the floor and at the top — but you have ` +
          `given ${run.widthAtFloorMm}mm and ${run.widthAtTopMm}mm. Please re-measure both.`,
    });
  });

  // --- Did they actually measure, or assume? ---
  const everythingPerfect =
    m.runs.every(
      (r) => r.widthAtFloorMm === r.widthAtTopMm && r.floorFallMm === 0
    ) &&
    m.startWall.outMm === 0 &&
    m.endWall.outMm === 0;

  if (everythingPerfect && m.method === 'assumed-square') {
    checks.push({
      code: 'assumed-square',
      level: 'confirm',
      message:
        'You have told us everything is perfectly square and level. That is unusual — most ' +
        'bathrooms are out by a few millimetres somewhere. If you have not actually checked ' +
        'the walls and floor, it is worth doing now: we cut to these numbers, and a wall that ' +
        'leans 5mm leaves a wedge-shaped gap no amount of silicone will hide.',
    });
  }

  if (!m.method) {
    checks.push({
      code: 'no-method',
      level: 'blocking',
      message: 'Please tell us how you checked the walls and floor.',
    });
  }

  // --- Floor, per run. ---
  m.runs.forEach((run, i) => {
    const where = m.runs.length > 1 ? ` along the ${labels[i].toLowerCase()}` : '';
    if (run.floorFallMm > 0 && !run.floorLowEnd) {
      checks.push({
        code: `run${i}-floor-no-direction`,
        level: 'blocking',
        runIndex: i,
        message: `You have told us the floor${where} is ${run.floorFallMm}mm out of level, but not which end is lower.`,
      });
    }
    if (run.floorFallMm > LARGE_LEAN_MM) {
      checks.push({
        code: `run${i}-floor-large-fall`,
        level: 'confirm',
        runIndex: i,
        message: `A ${run.floorFallMm}mm fall${where} is a lot. Please double-check it — if it is right, the bottom of the glass will be cut on the slope to match.`,
      });
    }
  });

  // --- The last gate. ---
  if (!m.shapeConfirmed && !checks.some((c) => c.level === 'blocking')) {
    checks.push({
      code: 'shape-unconfirmed',
      level: 'blocking',
      message: 'Please have a look at the drawing of your opening and confirm it matches.',
    });
  }

  return checks;
}

/** True when nothing is stopping the customer from carrying on. */
export function measurementsUsable(checks: MeasureCheck[]): boolean {
  return !checks.some((c) => c.level === 'blocking');
}

/**
 * A plain-English summary of how true the opening is, for the review screen
 * and the enquiry email.
 */
export function describeOpening(m: OpeningMeasurements, ctx: OpeningContext): string {
  const parts: string[] = [];
  const labels = ctx.labels ?? runLabels(m.runs.length);

  if (ctx.hasStartWall && m.startWall.outMm && m.startWall.direction) {
    parts.push(`first wall ${m.startWall.outMm}mm out, leaning ${m.startWall.direction}`);
  }
  if (ctx.hasEndWall && m.endWall.outMm && m.endWall.direction) {
    parts.push(`far wall ${m.endWall.outMm}mm out, leaning ${m.endWall.direction}`);
  }
  m.runs.forEach((run, i) => {
    if (run.floorFallMm && run.floorLowEnd) {
      const where = m.runs.length > 1 ? ` along the ${labels[i].toLowerCase()}` : '';
      parts.push(`floor${where} ${run.floorFallMm}mm lower at the ${run.floorLowEnd}`);
    }
  });

  if (parts.length === 0) return 'Square and level throughout.';
  return parts.join('; ');
}

/** The measured widths, run by run, for the email. */
export function describeWidths(m: OpeningMeasurements, labels = runLabels(m.runs.length)): string {
  return m.runs
    .map(
      (run, i) =>
        `${labels[i]}: ${run.widthAtFloorMm}mm at the floor, ${run.widthAtTopMm}mm at the top`
    )
    .join('; ');
}

/**
 * How the lean was established, written out for the workshop.
 *
 * Worth carrying into the email: a lean found with a laser is a different
 * quality of information from one someone eyeballed, and the person cutting
 * the glass should know which they are working from.
 */
export const METHOD_LABELS: Record<MeasureMethod, string> = {
  laser: 'Laser plumb line',
  packers: 'Spirit level and glazing packers',
  level: 'Spirit level',
  'assumed-square': 'Not checked — assumed square',
};

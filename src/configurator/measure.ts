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
 * 1. Never ask them to *judge* anything. "Is that wall plumb, and which way
 *    does it lean?" is a question people answer badly and confidently. Two
 *    tape readings against a vertical reference — the gap at the bottom and
 *    the gap at the top — give the same answer arithmetically, and the sign
 *    of the difference supplies the direction for free.
 *
 * 2. Derive whatever can be derived. The width at the top is the width at
 *    the bottom minus however far the walls lean in, so there is no reason to
 *    send someone up a ladder for a number we already know. It is offered as
 *    an optional check, not asked for as a measurement.
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

/**
 * A wall, measured as two gaps from a vertical reference — a laser line, a
 * plumb line, or the edge of a long level held true.
 *
 * Recorded as readings rather than as a lean because a reading is a thing the
 * customer can see on a tape. The lean, and which way it goes, fall out of
 * the arithmetic: nobody has to decide whether "into the shower" describes
 * what they are looking at.
 *
 * Null means not measured, which is different from zero and must not be
 * silently treated as plumb.
 */
export interface WallMeasurement {
  gapBottomMm: number | null;
  /**
   * Optional. A wall that leans is straight; a wall that bows is not, and the
   * middle reading is the only thing that tells them apart. A bow cannot be
   * followed by a single tapered cut, so it is worth knowing before cutting.
   */
  gapMiddleMm: number | null;
  gapTopMm: number | null;
}

export interface WallLean {
  /** Positive narrows the opening at the top. */
  signedMm: number;
  leanMm: number;
  direction: WallLeanDirection | null;
  /** How far the middle strays from a straight line between the two ends. */
  bowMm: number | null;
  isBowed: boolean;
}

/** Past this a wall is bowed rather than leaning, and needs a human to look. */
export const BOW_THRESHOLD_MM = 5;

/** Work out the lean, its direction and any bow. Null until both ends are in. */
export function wallLean(wall: WallMeasurement): WallLean | null {
  const { gapBottomMm: bottom, gapTopMm: top, gapMiddleMm: middle } = wall;
  if (bottom === null || top === null) return null;

  // A bigger gap at the top means the wall falls away from the reference up
  // there, so it leans out; a smaller one means it leans in and eats into the
  // opening. That is the sign the width arithmetic wants.
  const signedMm = Math.round(bottom - top);
  const bowMm =
    middle === null ? null : Math.round((middle - (top + bottom) / 2) * 10) / 10;

  return {
    signedMm,
    leanMm: Math.abs(signedMm),
    direction: signedMm === 0 ? null : signedMm > 0 ? 'in' : 'out',
    bowMm,
    isBowed: bowMm !== null && Math.abs(bowMm) > BOW_THRESHOLD_MM,
  };
}

export function createWallMeasurement(): WallMeasurement {
  return { gapBottomMm: null, gapMiddleMm: null, gapTopMm: null };
}

/** True once the customer has given us enough to work with. */
export function wallMeasured(wall: WallMeasurement): boolean {
  return wall.gapBottomMm !== null && wall.gapTopMm !== null;
}

export interface RunMeasurement {
  /** Wall (or corner) to wall (or corner), measured along the floor. */
  widthAtFloorMm: number;
  /**
   * Optional. The top width is derived from the floor width and the wall
   * leans, so this is only here for someone who measured it anyway and wants
   * it checked. When it is set, it has to agree.
   */
  widthAtTopCheckMm: number | null;
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
    widthAtTopCheckMm: null,
    floorFallMm: 0,
    floorLowEnd: null,
  };
}

export function createOpeningMeasurements(runWidthsMm: number[] = [1000]): OpeningMeasurements {
  return {
    runs: runWidthsMm.map(createRun),
    startWall: createWallMeasurement(),
    endWall: createWallMeasurement(),
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
  return wallLean(wall)?.signedMm ?? 0;
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

/**
 * The width at the top of the glass.
 *
 * Derived, not measured: it is the floor width less however far each bounding
 * wall leans into the opening. A run between two corners has no wall to lean,
 * so it comes out the same at both ends.
 */
export function topWidthMm(
  m: OpeningMeasurements,
  runIndex: number,
  ctx: OpeningContext
): number {
  const run = m.runs[runIndex];
  if (!run) return 0;
  return Math.round(
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
  /** A corrected value they can accept with one tap. */
  suggestionMm?: number;
}

/** Anything outside this is a typo or the wrong units, not a bathroom. */
const MIN_PLAUSIBLE_MM = 400;
const MAX_PLAUSIBLE_MM = 3000;

/** A gap to a laser line or a level. Bigger than this and something is wrong. */
const MAX_GAP_MM = 300;

/**
 * How far an optional top-width check may disagree with the derived figure.
 *
 * 3mm is roughly the best a careful amateur does with a tape over a metre,
 * and it is also small enough that a panel cut to it still fits. Beyond that
 * the readings are telling us something real.
 */
const CROSS_CHECK_TOLERANCE_MM = 3;

/**
 * An out-of-plumb wall past this is unusual enough to be worth a second look.
 * Real bathrooms do manage it, so this asks rather than blocks.
 */
const LARGE_LEAN_MM = 20;

/**
 * Catch the slip where someone types the right number in the wrong unit.
 *
 * 90 for 900 and 0.9 for 900 are the two that actually reach workshops, and
 * neither is caught by "is it a positive number". Offering the corrected
 * figure to accept with one tap beats telling someone they are wrong.
 */
function unitSlip(value: number, name: string): MeasureCheck | null {
  if (value >= MIN_PLAUSIBLE_MM) return null;

  const fromMetres = Math.round(value * 1000);
  const fromCm = Math.round(value * 10);

  if (value > 0 && value < 10 && fromMetres <= MAX_PLAUSIBLE_MM && fromMetres >= MIN_PLAUSIBLE_MM) {
    return {
      code: 'unit-metres',
      level: 'blocking',
      message: `${value} looks like metres. Did you mean ${fromMetres}mm for the ${name}?`,
      suggestionMm: fromMetres,
    };
  }
  if (fromCm >= MIN_PLAUSIBLE_MM && fromCm <= MAX_PLAUSIBLE_MM) {
    return {
      code: 'unit-centimetres',
      level: 'blocking',
      message: `${value} looks like centimetres. Did you mean ${fromCm}mm for the ${name}?`,
      suggestionMm: fromCm,
    };
  }
  return null;
}

export function checkMeasurements(
  m: OpeningMeasurements,
  ctx: OpeningContext
): MeasureCheck[] {
  const checks: MeasureCheck[] = [];
  const labels = ctx.labels ?? runLabels(m.runs.length);
  const named = (i: number) => (m.runs.length > 1 ? `${labels[i].toLowerCase()} ` : '');

  // --- Floor widths, before anything is derived from them. ---
  m.runs.forEach((run, i) => {
    const name = `${named(i)}width at the floor`;
    const value = run.widthAtFloorMm;

    if (!value) {
      checks.push({
        code: `run${i}-widthAtFloor-missing`,
        level: 'blocking',
        message: `We still need the ${name}.`,
        runIndex: i,
      });
      return;
    }

    const slip = unitSlip(value, name);
    if (slip) {
      checks.push({ ...slip, code: `run${i}-widthAtFloor-${slip.code}`, runIndex: i });
      return;
    }

    if (value < MIN_PLAUSIBLE_MM || value > MAX_PLAUSIBLE_MM) {
      checks.push({
        code: `run${i}-widthAtFloor-implausible`,
        level: 'blocking',
        message: `${value}mm for the ${name} looks wrong — we need millimetres, so a 1.4 metre opening is 1400. Please check and re-measure.`,
        runIndex: i,
      });
    }
  });

  // Nothing below this point means anything if the widths are nonsense.
  if (checks.some((c) => c.level === 'blocking')) return checks;

  // --- The walls, as two readings each. ---
  const walls: [string, WallMeasurement, string][] = [];
  if (ctx.hasStartWall) walls.push(['startWall', m.startWall, 'first wall']);
  if (ctx.hasEndWall) walls.push(['endWall', m.endWall, 'far wall']);

  const checkedWalls = m.method !== null && m.method !== 'assumed-square';

  for (const [key, wall, name] of walls) {
    for (const [field, value, where] of [
      ['gapBottomMm', wall.gapBottomMm, 'bottom'],
      ['gapMiddleMm', wall.gapMiddleMm, 'middle'],
      ['gapTopMm', wall.gapTopMm, 'top'],
    ] as const) {
      if (value === null) continue;
      if (value < 0) {
        checks.push({
          code: `${key}-${field}-negative`,
          level: 'blocking',
          message: `The gap at the ${where} of the ${name} cannot be less than zero.`,
        });
      } else if (value > MAX_GAP_MM) {
        checks.push({
          code: `${key}-${field}-too-big`,
          level: 'confirm',
          message: `${value}mm is a big gap at the ${where} of the ${name}. Check you measured from the line or the level to the wall, and not something else.`,
        });
      }
    }

    if (checkedWalls && !wallMeasured(wall)) {
      checks.push({
        code: `${key}-not-measured`,
        level: 'blocking',
        message: `We need the gap at the bottom and at the top of the ${name}. If it is dead plumb, both readings will be the same — enter them anyway so we know it was checked.`,
      });
      continue;
    }

    const lean = wallLean(wall);
    if (!lean) continue;

    if (lean.leanMm > LARGE_LEAN_MM) {
      checks.push({
        code: `${key}-large-lean`,
        level: 'confirm',
        message: `Those readings make the ${name} ${lean.leanMm}mm out of plumb over ${ctx.glassHeightMm}mm, leaning ${lean.direction}. It does happen — but please double-check them, because we will cut the glass to follow it.`,
      });
    }

    if (lean.isBowed) {
      checks.push({
        code: `${key}-bowed`,
        level: 'confirm',
        message: `The middle reading on the ${name} is ${Math.abs(lean.bowMm ?? 0)}mm off a straight line between the top and the bottom, so the wall bows rather than leans. Glass is cut straight and cannot follow a curve — please check the reading, and send us a photo of that wall so we can see what we are dealing with.`,
      });
    }
  }

  // --- The optional top-width check. ---
  m.runs.forEach((run, i) => {
    if (run.widthAtTopCheckMm === null) return;

    const slip = unitSlip(run.widthAtTopCheckMm, `${named(i)}width at the top`);
    if (slip) {
      checks.push({ ...slip, code: `run${i}-widthAtTopCheck-${slip.code}`, runIndex: i });
      return;
    }

    const derived = topWidthMm(m, i, ctx);
    const discrepancy = Math.round(run.widthAtTopCheckMm - derived);
    if (Math.abs(discrepancy) <= CROSS_CHECK_TOLERANCE_MM) return;

    const where = m.runs.length > 1 ? ` on the ${labels[i].toLowerCase()}` : '';
    const bounding = wallsForRun(m, i, ctx);

    checks.push({
      code: `run${i}-cross-check-mismatch`,
      level: 'blocking',
      runIndex: i,
      message: bounding.length
        ? `Your readings do not agree with each other${where}. From the floor width and the wall ` +
          `readings, the top should measure ${derived}mm — but you measured ${run.widthAtTopCheckMm}mm, ` +
          `about ${Math.abs(discrepancy)}mm out. Either the width at the top or one of the wall ` +
          `readings is wrong. This is exactly the kind of mistake that ends up as a panel that ` +
          `does not fit.`
        : `The measurements${where} do not agree. Both ends of this run meet glass rather than a ` +
          `wall, so it should be the same width top and bottom — but you have given ` +
          `${run.widthAtFloorMm}mm and ${run.widthAtTopCheckMm}mm. Please re-measure both.`,
    });
  });

  // --- Did they actually check, or assume? ---
  if (!m.method) {
    checks.push({
      code: 'no-method',
      level: 'blocking',
      message: 'Please tell us how you checked the walls and floor.',
    });
  }

  if (m.method === 'assumed-square') {
    checks.push({
      code: 'assumed-square',
      level: 'confirm',
      message:
        'You have not checked whether the walls are plumb, so we will cut the glass square. ' +
        'Most bathrooms are out by a few millimetres somewhere, and where they are, the gap ' +
        'will be wider at one end than the other. If you can borrow a level, it is worth ten ' +
        'minutes now.',
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

  for (const [wall, name, present] of [
    [m.startWall, 'first wall', ctx.hasStartWall],
    [m.endWall, 'far wall', ctx.hasEndWall],
  ] as const) {
    if (!present) continue;
    const lean = wallLean(wall);
    if (!lean) continue;
    if (lean.leanMm > 0) {
      parts.push(
        `${name} ${lean.leanMm}mm out of plumb, leaning ${lean.direction} ` +
          `(gap ${wall.gapBottomMm}mm at the bottom, ${wall.gapTopMm}mm at the top)`
      );
    }
    if (lean.isBowed) parts.push(`${name} bows ${Math.abs(lean.bowMm ?? 0)}mm at mid height`);
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

/**
 * The widths, run by run, for the email. The floor figure is measured; the
 * top is worked out from it and the wall readings, and is labelled as such so
 * nobody takes it for a second reading.
 */
export function describeWidths(
  m: OpeningMeasurements,
  ctx: OpeningContext,
  labels = ctx.labels ?? runLabels(m.runs.length)
): string {
  return m.runs
    .map((run, i) => {
      const top = topWidthMm(m, i, ctx);
      const checked =
        run.widthAtTopCheckMm !== null ? `, customer also measured ${run.widthAtTopCheckMm}mm` : '';
      return `${labels[i]}: ${run.widthAtFloorMm}mm measured at the floor, ${top}mm derived at the top${checked}`;
    })
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
  'assumed-square': 'Not checked — cut square',
};

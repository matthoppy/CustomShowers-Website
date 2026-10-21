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
 * 2. Cross-check everything against everything else. The width at the floor,
 *    the width at the top and the two wall leans are not independent — they
 *    have to add up. When they don't, one of the four is wrong, and we can
 *    say so while it is still free to fix.
 *
 * The second is the whole point. Any form can collect four numbers; this one
 * can tell the customer that their four numbers disagree.
 */

/** Which way the top of a wall leans, from the point of view of the shower. */
export type WallLeanDirection = 'in' | 'out';

/** Which end of the opening the floor is lower at. */
export type FloorLowEnd = 'left' | 'right';

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

export interface OpeningMeasurements {
  /** Wall to wall, measured along the floor. */
  widthAtFloorMm: number;
  /** Wall to wall, measured at the top of where the glass will go. */
  widthAtTopMm: number;
  leftWall: WallMeasurement;
  rightWall: WallMeasurement;
  floor: {
    /** Difference in floor height across the opening. 0 = level. */
    fallMm: number;
    lowEnd: FloorLowEnd | null;
  };
  method: MeasureMethod | null;
  /** Set once the customer has confirmed the drawn-back shape looks right. */
  shapeConfirmed: boolean;
}

export function createOpeningMeasurements(widthMm = 1000): OpeningMeasurements {
  return {
    widthAtFloorMm: widthMm,
    widthAtTopMm: widthMm,
    leftWall: { outMm: 0, direction: null },
    rightWall: { outMm: 0, direction: null },
    floor: { fallMm: 0, lowEnd: null },
    method: null,
    shapeConfirmed: false,
  };
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

/** The top width implied by the floor width and the two wall leans. */
export function impliedTopWidthMm(m: OpeningMeasurements): number {
  return m.widthAtFloorMm - signedLeanMm(m.leftWall) - signedLeanMm(m.rightWall);
}

export type CheckLevel = 'blocking' | 'confirm' | 'hint';

export interface MeasureCheck {
  code: string;
  level: CheckLevel;
  /** Addressed to the customer, in their words, saying what to do about it. */
  message: string;
  /** Which field to highlight, where there is a single culprit. */
  field?: keyof OpeningMeasurements | 'widthAtTopMm' | 'widthAtFloorMm';
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
  glassHeightMm: number
): MeasureCheck[] {
  const checks: MeasureCheck[] = [];

  // --- Plausibility, before anything is derived from the numbers. ---
  for (const [field, value, name] of [
    ['widthAtFloorMm', m.widthAtFloorMm, 'width at the floor'],
    ['widthAtTopMm', m.widthAtTopMm, 'width at the top'],
  ] as const) {
    if (!value) {
      checks.push({
        code: `${field}-missing`,
        level: 'blocking',
        message: `We still need the ${name}.`,
        field,
      });
    } else if (value < MIN_PLAUSIBLE_MM || value > MAX_PLAUSIBLE_MM) {
      checks.push({
        code: `${field}-implausible`,
        level: 'blocking',
        message: `${value}mm for the ${name} looks wrong — we need millimetres, so a 1.4 metre opening is 1400. Please check and re-measure.`,
        field,
      });
    }
  }

  // Nothing below this point means anything if the widths are nonsense.
  if (checks.some((c) => c.level === 'blocking')) return checks;

  // --- Direction is not optional. ---
  for (const [key, wall, name] of [
    ['leftWall', m.leftWall, 'left wall'],
    ['rightWall', m.rightWall, 'right wall'],
  ] as const) {
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
        message: `${wall.outMm}mm is a lot of lean on the ${name} over ${glassHeightMm}mm of height. It does happen — but please double-check it before you send, because we will cut the glass to follow it.`,
      });
    }
  }

  // --- The cross-check. ---
  const implied = impliedTopWidthMm(m);
  const discrepancy = Math.round(m.widthAtTopMm - implied);

  if (Math.abs(discrepancy) > CROSS_CHECK_TOLERANCE_MM) {
    const leftOut = signedLeanMm(m.leftWall);
    const rightOut = signedLeanMm(m.rightWall);
    const leanTotal = leftOut + rightOut;
    const widthDrop = m.widthAtFloorMm - m.widthAtTopMm;

    checks.push({
      code: 'cross-check-mismatch',
      level: 'blocking',
      message:
        `These numbers do not agree with each other. Your opening narrows by ${widthDrop}mm ` +
        `between the floor and the top, but the wall leans you have given add up to ${leanTotal}mm. ` +
        `One of the four measurements is out by about ${Math.abs(discrepancy)}mm. ` +
        `Please re-check the width at the top and both wall leans — this is exactly the kind of ` +
        `mistake that ends up as a panel that does not fit.`,
    });
  }

  // --- Did they actually measure, or assume? ---
  const everythingPerfect =
    m.widthAtFloorMm === m.widthAtTopMm &&
    m.leftWall.outMm === 0 &&
    m.rightWall.outMm === 0 &&
    m.floor.fallMm === 0;

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

  // --- Floor. ---
  if (m.floor.fallMm > 0 && !m.floor.lowEnd) {
    checks.push({
      code: 'floor-no-direction',
      level: 'blocking',
      message: `You have told us the floor is ${m.floor.fallMm}mm out of level, but not which end is lower.`,
    });
  }
  if (m.floor.fallMm > LARGE_LEAN_MM) {
    checks.push({
      code: 'floor-large-fall',
      level: 'confirm',
      message: `A ${m.floor.fallMm}mm fall across the floor is a lot. Please double-check it — if it is right, the bottom of the glass will be cut on the slope to match.`,
    });
  }

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
 * A one-line summary of how true the opening is, for the review screen and
 * the enquiry email.
 */
export function describeOpening(m: OpeningMeasurements): string {
  const parts: string[] = [];
  if (m.leftWall.outMm && m.leftWall.direction) {
    parts.push(`left wall ${m.leftWall.outMm}mm out, leaning ${m.leftWall.direction}`);
  }
  if (m.rightWall.outMm && m.rightWall.direction) {
    parts.push(`right wall ${m.rightWall.outMm}mm out, leaning ${m.rightWall.direction}`);
  }
  if (m.floor.fallMm && m.floor.lowEnd) {
    parts.push(`floor ${m.floor.fallMm}mm lower at the ${m.floor.lowEnd}`);
  }
  if (parts.length === 0) return 'Square and level throughout.';
  return parts.join('; ');
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

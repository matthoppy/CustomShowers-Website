/**
 * Rake calculations for laser measurements.
 *
 * The fitter projects a VERTICAL laser line parallel to each wall, then measures
 * with a tape from the laser line to the wall at the top, middle (optional) and bottom.
 *
 * SIGN CONVENTION:
 * rake = gapTop - gapBottom
 * - Positive rake: wall leans OUT at the top (gap increases going up)
 * - Negative rake: wall leans IN at the top (gap decreases going up)
 *
 * Example: top 50mm, bottom 48mm gives rake = +2mm
 * Plain English: "Wall leans out 2mm at the top over 1950mm"
 */

export interface LaserGapMeasurements {
  gapTopMm: number;
  gapMiddleMm?: number;
  gapBottomMm: number;
  heightMm: number;
}

export interface RakeResult {
  rakeMm: number;
  heightMm: number;
  description: string;
  isBowed: boolean;
  bowMm?: number;
  needsDoubleCheck: boolean;
  warningMessage?: string;
}

const RAKE_WARNING_THRESHOLD_MM = 10;
const BOW_WARNING_THRESHOLD_MM = 5;

/**
 * Calculate rake from laser gap measurements.
 *
 * @param gaps - Laser gap measurements (top, optional middle, bottom, and height)
 * @param wallName - Human-readable wall name for description (e.g. "Left wall", "Back wall")
 * @returns Rake analysis with description and warnings
 */
export function calculateRake(gaps: LaserGapMeasurements, wallName: string): RakeResult {
  const { gapTopMm, gapMiddleMm, gapBottomMm, heightMm } = gaps;

  const rakeMm = gapTopMm - gapBottomMm;

  const absRake = Math.abs(rakeMm);
  const needsDoubleCheck = absRake > RAKE_WARNING_THRESHOLD_MM;

  let description: string;
  if (Math.abs(rakeMm) < 0.5) {
    description = `${wallName} is plumb (vertical) over ${heightMm}mm`;
  } else if (rakeMm > 0) {
    description = `${wallName} leans out ${rakeMm}mm at the top over ${heightMm}mm`;
  } else {
    description = `${wallName} leans in ${Math.abs(rakeMm)}mm at the top over ${heightMm}mm`;
  }

  let isBowed = false;
  let bowMm: number | undefined;
  let warningMessage: string | undefined;

  if (gapMiddleMm !== undefined) {
    const expectedMiddle = (gapTopMm + gapBottomMm) / 2;
    const deviation = Math.abs(gapMiddleMm - expectedMiddle);

    if (deviation > 1) {
      isBowed = true;
      bowMm = deviation;

      if (deviation > BOW_WARNING_THRESHOLD_MM) {
        warningMessage = `${wallName} is bowed by ${deviation.toFixed(1)}mm at the middle — please double-check`;
      }
    }
  }

  if (!warningMessage && needsDoubleCheck) {
    warningMessage = `${wallName} rake of ${absRake}mm is significant — please double-check with a tape measure`;
  }

  return {
    rakeMm,
    heightMm,
    description,
    isBowed,
    bowMm,
    needsDoubleCheck,
    warningMessage,
  };
}

/**
 * Format rake measurements for display in review or email.
 */
export function formatRakeForDisplay(gaps: LaserGapMeasurements, wallName: string): string {
  const { gapTopMm, gapMiddleMm, gapBottomMm } = gaps;
  const rake = calculateRake(gaps, wallName);

  let display = `${wallName}: Top ${gapTopMm}mm`;
  if (gapMiddleMm !== undefined) {
    display += `, Middle ${gapMiddleMm}mm`;
  }
  display += `, Bottom ${gapBottomMm}mm`;
  display += ` → ${rake.description}`;

  if (rake.warningMessage) {
    display += ` ⚠️ ${rake.warningMessage}`;
  }

  return display;
}

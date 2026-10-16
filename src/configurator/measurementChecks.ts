/**
 * Sanity checks for measurements typed in by someone who has never measured a
 * shower before.
 *
 * The mistakes that actually reach the workshop are few and predictable:
 * centimetres typed into a millimetre box (90 for 900), metres (0.9), an extra
 * or missing digit, and a wall-to-wall width that varies more than the reader
 * realised. None of these are caught by "is it a positive number", and all of
 * them end in glass cut to the wrong size.
 *
 * Every check here is advisory except the truly impossible. A real alcove can
 * be 2950mm wide, so we ask the customer to confirm rather than refuse.
 */

export type CheckSeverity = 'confirm' | 'block';

export interface MeasurementIssue {
  severity: CheckSeverity;
  message: string;
  /** A corrected value the customer can accept with one tap. */
  suggestionMm?: number;
}

type Kind = 'width' | 'height' | 'head' | 'gap';

interface Range {
  /** Below this looks like a units slip or a typo. */
  min: number;
  /** Above this is unusual enough to ask about. */
  max: number;
  /** Above this cannot be a shower and is refused outright. */
  hardMax: number;
}

const RANGES: Record<Kind, Range> = {
  width: { min: 150, max: 2500, hardMax: 6000 },
  height: { min: 1000, max: 2800, hardMax: 4000 },
  head: { min: 1000, max: 2600, hardMax: 4000 },
  gap: { min: 0, max: 150, hardMax: 1000 },
};

/** Widths that differ by more than this between bottom, middle and top get a second look. */
export const SPREAD_CONFIRM_MM = 15;
/** Beyond this the difference is more likely a misread than a wonky wall. */
export const SPREAD_LIKELY_ERROR_MM = 50;

export function kindForStep(stepId: string): Kind | null {
  if (stepId === 'height-measurement') return 'height';
  if (stepId === 'shower-head-height') return 'head';
  if (stepId.includes('-gap-')) return 'gap';
  if (stepId.includes('width') || stepId.includes('depth')) return 'width';
  return null;
}

const inRange = (v: number, r: Range) => v >= r.min && v <= r.max;

/**
 * Checks a single typed value. Returns null when it looks fine or is empty
 * (emptiness is the required-field check's job, not ours).
 */
export function checkValue(stepId: string, raw: string): MeasurementIssue | null {
  const kind = kindForStep(stepId);
  if (!kind || raw.trim() === '') return null;

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return { severity: 'block', message: 'Enter the measurement as a number of millimetres.' };
  }

  const range = RANGES[kind];

  if (kind === 'gap') {
    if (value < 0) return { severity: 'block', message: 'A gap can’t be less than 0mm.' };
    if (value > range.hardMax) {
      return { severity: 'block', message: 'That gap is too big. Set the laser line closer to the wall and measure again.' };
    }
    if (value > range.max) {
      return {
        severity: 'confirm',
        message: `${value}mm is a big gap. Most people set the line 20–100mm off the wall. Check you measured to the line, not to the laser itself.`,
      };
    }
    return null;
  }

  if (value <= 0) return { severity: 'block', message: 'Enter a measurement greater than 0mm.' };

  if (value > range.hardMax) {
    const tenth = Math.round(value / 10);
    return {
      severity: 'block',
      message: `${value}mm is over ${range.hardMax / 1000} metres, which can’t be right. Check for an extra digit.`,
      suggestionMm: inRange(tenth, range) ? tenth : undefined,
    };
  }

  if (value < range.min) {
    // 0.9 → metres, 90 → centimetres. Offer whichever lands in a sensible range.
    const fromMetres = Math.round(value * 1000);
    const fromCm = Math.round(value * 10);
    if (value < 10 && inRange(fromMetres, range)) {
      return {
        severity: 'confirm',
        message: `That looks like metres. Did you mean ${fromMetres}mm?`,
        suggestionMm: fromMetres,
      };
    }
    if (inRange(fromCm, range)) {
      return {
        severity: 'confirm',
        message: `That looks like centimetres. Did you mean ${fromCm}mm?`,
        suggestionMm: fromCm,
      };
    }
    return {
      severity: 'confirm',
      message: `${value}mm is very small for a shower. Measurements go in millimetres — 1 metre is 1000mm.`,
    };
  }

  if (value > range.max) {
    return {
      severity: 'confirm',
      message: `${value}mm is larger than most showers. Check you read the tape correctly.`,
    };
  }

  return null;
}

/** The measurement a step id belongs to, without its bottom/middle/top position. */
export function groupOf(stepId: string): string | null {
  const m = stepId.match(/^(.*)-(bottom|middle|top)$/);
  return m && !stepId.includes('-gap-') ? m[1] : null;
}

/**
 * Compares the bottom, middle and top readings of one measurement once at
 * least two are in. Glass is cut to the smallest, so a misread on any one of
 * them silently becomes the order size.
 */
export function checkSpread(
  stepId: string,
  values: Record<string, string>
): MeasurementIssue | null {
  const group = groupOf(stepId);
  if (!group) return null;

  const readings = (['bottom', 'middle', 'top'] as const)
    .map((pos) => ({ pos, v: Number(values[`${group}-${pos}`]) }))
    .filter((r) => Number.isFinite(r.v) && r.v > 0);
  if (readings.length < 2) return null;

  const max = Math.max(...readings.map((r) => r.v));
  const min = Math.min(...readings.map((r) => r.v));
  const spread = max - min;
  if (spread <= SPREAD_CONFIRM_MM) return null;

  const list = readings.map((r) => `${r.pos} ${r.v}mm`).join(', ');
  if (spread > SPREAD_LIKELY_ERROR_MM) {
    return {
      severity: 'confirm',
      message: `These differ by ${spread}mm (${list}). Walls are rarely that far out, so one is probably misread. Please measure again. We make the glass to the smallest size.`,
    };
  }
  return {
    severity: 'confirm',
    message: `These differ by ${spread}mm (${list}). That can happen with uneven walls, but measure again to be sure. We make the glass to the smallest size.`,
  };
}

/** All issues for the value currently on screen, most serious first. */
export function issuesForStep(
  stepId: string,
  values: Record<string, string>
): MeasurementIssue[] {
  const issues = [checkValue(stepId, values[stepId] ?? ''), checkSpread(stepId, values)].filter(
    (i): i is MeasurementIssue => i !== null
  );
  return issues.sort((a, b) => (a.severity === 'block' ? -1 : 0) - (b.severity === 'block' ? -1 : 0));
}

/**
 * Measurement Types and Helpers
 */

export type RakeType = 'plumb' | 'level' | 'out' | 'in' | 'rise';

export interface MeasurementPoint {
  id: string;
  label: string;
  value: number; // in mm
  rakeType: RakeType;
  /** Rake angle in degrees (for non-plumb/level measurements) */
  rakeAngle?: number;
  /** Position on diagram [x, y] as percentage */
  position: [number, number];
  /** Orientation of label */
  orientation: 'horizontal' | 'vertical' | 'angled';
}

export interface ShowerMeasurements {
  // Basic dimensions
  width: number;
  height: number;
  depth?: number;

  // Detailed measurements with rakes
  measurements: MeasurementPoint[];

  // Computed values
  wall_to_wall: boolean;
  has_rakes: boolean;
}

/**
 * Rake type display names
 */
export const RAKE_TYPE_NAMES: Record<RakeType, string> = {
  plumb: 'Plumb',
  level: 'Level',
  out: 'Out',
  in: 'In',
  rise: 'Rise',
};

/**
 * Rake type descriptions
 */
export const RAKE_TYPE_DESCRIPTIONS: Record<RakeType, string> = {
  plumb: 'Vertical (90° to floor)',
  level: 'Horizontal (parallel to floor)',
  out: 'Angled outward',
  in: 'Angled inward',
  rise: 'Sloped upward',
};

/**
 * Default measurement points for inline shower
 */
export const DEFAULT_INLINE_MEASUREMENTS: MeasurementPoint[] = [
  {
    id: 'left-wall',
    label: 'Left Wall',
    value: 2000,
    rakeType: 'plumb',
    position: [15, 50],
    orientation: 'vertical',
  },
  {
    id: 'right-wall',
    label: 'Right Wall',
    value: 2000,
    rakeType: 'plumb',
    position: [85, 50],
    orientation: 'vertical',
  },
  {
    id: 'width',
    label: 'Width',
    value: 1000,
    rakeType: 'level',
    position: [50, 85],
    orientation: 'horizontal',
  },
];

/**
 * Default measurement points for corner shower
 */
export const DEFAULT_CORNER_MEASUREMENTS: MeasurementPoint[] = [
  {
    id: 'back-wall-left',
    label: 'Back Wall Left',
    value: 1600,
    rakeType: 'plumb',
    position: [20, 50],
    orientation: 'vertical',
  },
  {
    id: 'back-wall-right',
    label: 'Back Wall Right',
    value: 1600,
    rakeType: 'plumb',
    position: [80, 50],
    orientation: 'vertical',
  },
  {
    id: 'side-wall-top',
    label: 'Side Wall Top',
    value: 400,
    rakeType: 'plumb',
    position: [15, 25],
    orientation: 'vertical',
  },
  {
    id: 'side-wall-bottom',
    label: 'Side Wall Bottom',
    value: 400,
    rakeType: 'plumb',
    position: [15, 75],
    orientation: 'vertical',
  },
  {
    id: 'back-width-top',
    label: 'Back Width Top',
    value: 200,
    rakeType: 'level',
    position: [30, 15],
    orientation: 'horizontal',
  },
  {
    id: 'back-width-center',
    label: 'Back Width Center',
    value: 1000,
    rakeType: 'level',
    position: [50, 50],
    orientation: 'horizontal',
  },
  {
    id: 'back-width-bottom',
    label: 'Back Width Bottom',
    value: 200,
    rakeType: 'level',
    position: [70, 85],
    orientation: 'horizontal',
  },
  {
    id: 'side-depth',
    label: 'Side Depth',
    value: 600,
    rakeType: 'level',
    position: [30, 60],
    orientation: 'horizontal',
  },
  {
    id: 'return-depth',
    label: 'Return Depth',
    value: 3,
    rakeType: 'rise',
    position: [50, 75],
    orientation: 'horizontal',
  },
];

/**
 * Validation constraints for measurements
 */
export const MEASUREMENT_CONSTRAINTS = {
  width: { min: 600, max: 3000 },
  height: { min: 1800, max: 2400 },
  depth: { min: 600, max: 1500 },
  rakeAngle: { min: 1, max: 45 }, // degrees from vertical/horizontal
} as const;

/**
 * Validate a measurement value
 */
export function validateMeasurement(
  type: 'width' | 'height' | 'depth',
  value: number
): { valid: boolean; error?: string } {
  const constraints = MEASUREMENT_CONSTRAINTS[type];

  if (value < constraints.min) {
    return {
      valid: false,
      error: `Minimum ${type} is ${constraints.min}mm`,
    };
  }

  if (value > constraints.max) {
    return {
      valid: false,
      error: `Maximum ${type} is ${constraints.max}mm`,
    };
  }

  return { valid: true };
}

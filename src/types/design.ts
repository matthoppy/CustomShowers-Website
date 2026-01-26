/**
 * Design Type Definitions
 * All measurements in millimeters (mm)
 */

export type GlassType = 'clear' | 'frosted' | 'tinted';
export type GlassThickness = 8 | 10 | 12;
export type ConfigurationType = 'inline' | 'corner' | 'wetroom' | 'walk-in';
export type DoorType = 'hinged' | 'sliding' | 'pivot' | 'fixed';
export type DoorOpening = 'inward' | 'outward' | 'left' | 'right' | 'both';
export type HardwareFinish = 'chrome' | 'brushed-nickel' | 'matte-black' | 'gold' | 'polished-brass' | 'oil-rubbed-bronze' | 'brushed-bronze' | 'gun-metal' | 'polished-nickel' | 'satin-brass' | 'unlacquered-brass' | 'antic-brass' | 'satin-chrome' | 'satin-nickel';
export type DesignStatus = 'draft' | 'quoted' | 'ordered' | 'archived';

export interface Measurements {
  /** Width in millimeters */
  width: number;
  /** Height in millimeters */
  height: number;
  /** Depth in millimeters (for enclosures) */
  depth?: number;
  /** Whether installation is wall-to-wall */
  wall_to_wall: boolean;
  /** Left wall angle in degrees (90 = perpendicular) */
  left_angle?: number;
  /** Right wall angle in degrees (90 = perpendicular) */
  right_angle?: number;
  /** Floor to ceiling height in millimeters */
  floor_to_ceiling?: number;
}

export interface DesignOptions {
  /** Include professional installation service */
  include_installation?: boolean;
  /** Include shower tray */
  shower_tray?: boolean;
  /** Type of drainage */
  drainage_type?: string;
  /** Special requirements or notes */
  special_requirements?: string;
  /** Customer notes */
  customer_notes?: string;
}

export interface Design {
  id: string;
  customer_id?: string;
  status: DesignStatus;

  // Measurements
  measurements: Measurements;

  // Glass specifications
  glass_type: GlassType;
  glass_thickness: GlassThickness;

  // Configuration
  configuration_type: ConfigurationType;
  door_type?: DoorType;
  door_opening?: DoorOpening;

  // Hardware
  hardware_finish: HardwareFinish;
  hinge_type?: string;
  handle_type?: string;

  // Options
  options: DesignOptions;

  // Visual
  design_snapshot?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DesignFormData {
  // Step 1: Measurements
  measurements: Measurements;

  // Step 2: Glass Selection
  glass_type: GlassType;
  glass_thickness: GlassThickness;

  // Step 3: Configuration
  configuration_type: ConfigurationType;
  door_type?: DoorType;
  door_opening?: DoorOpening;

  // Step 4: Hardware
  hardware_finish: HardwareFinish;
  hinge_type?: string;
  handle_type?: string;

  // Step 5: Options
  options: DesignOptions;
}

/**
 * Validation constraints for designs
 */
export const DESIGN_CONSTRAINTS = {
  measurements: {
    width: { min: 700, max: 3000 }, // mm
    height: { min: 1800, max: 2400 }, // mm
    depth: { min: 700, max: 1500 }, // mm
    angle: { min: 45, max: 135 }, // degrees
  },
  glass: {
    /** Minimum glass thickness by panel size (width x height in mm²) */
    thickness_by_size: {
      8: { max: 2_000_000 }, // 8mm up to 2m²
      10: { max: 3_500_000 }, // 10mm up to 3.5m²
      12: { max: 5_000_000 }, // 12mm up to 5m²
    },
  },
} as const;

/**
 * Helper type for design validation errors
 */
export interface DesignValidationError {
  field: string;
  message: string;
  constraint?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
}

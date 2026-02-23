/**
 * Door Module Types
 * Specialized types for the Door product brain
 */

export type DoorConfigType = 'left' | 'right' | 'double';
export type DoorHeightMode = 'standard' | 'floor_to_ceiling';
export type DoorThresholdType = 'none' | 'clear_threshold' | 'tapered_threshold';
export type DoorHardwareFinish = 'chrome' | 'black' | 'brushed_nickel' | 'brass' | 'other';
export type GlassType = 'clear' | 'low_iron' | 'satin' | 'bronze';
export type HingeType = 'geneva' | 'vienna' | 'bellagio';

export interface DoorMeasurements {
    // Horizontal (Laser)
    left_wall_to_vertical_laser_bottom?: number;
    vertical_laser_to_right_wall_bottom?: number;
    left_wall_to_vertical_laser_top?: number;
    vertical_laser_to_right_wall_top?: number;

    // Vertical (Laser)
    floor_to_horizontal_laser_left?: number;
    horizontal_laser_to_ceiling_left?: number;
    floor_to_horizontal_laser_right?: number;
    horizontal_laser_to_ceiling_right?: number;

    // Standard Mode Inputs
    glass_height_hinge_side_mm?: number;
    horizontal_laser_to_top_level_left?: number;
    horizontal_laser_to_top_level_right?: number;
}

export interface DoorDerivedValues {
    opening_width_bottom_mm?: number;
    opening_width_top_mm?: number;
    height_left_mm?: number;
    height_right_mm?: number;
    wall_rake_mm?: number;
    width_difference_mm?: number;
}

export interface DoorDeductions {
    hinge_side: number;
    handle_side: number;
    bottom: number;
    total_width: number;
    total_height: number;
}

export interface DoorState {
    door_type: DoorConfigType;
    height_mode: DoorHeightMode;
    glass_type: GlassType;
    hinge_type: HingeType;
    seals_required: boolean;
    threshold_type: DoorThresholdType;
    hardware_finish: DoorHardwareFinish;
    ceiling_air_gap_mm: number;
    measurements: DoorMeasurements;
    derived: DoorDerivedValues;
    deductions: DoorDeductions;
    warnings: string[];
}

export type DoorOverlayType =
    | 'laser_crosshair'
    | 'laser_dimension_red'
    | 'total_dimension_blue'
    | 'swing_arrow'
    | 'highlight_field';

export interface DoorOverlay {
    type: DoorOverlayType;
    meta: any;
}

export interface DoorModuleOutput {
    screen: 'options' | 'dimensions' | 'confirmation';
    layout_key: 'single';
    preview: {
        asset_id: string | null;
        hardware_colour: string;
        overlays: DoorOverlay[];
    };
    state: DoorState;
    next_required_inputs: string[];
    questions: string[];
}

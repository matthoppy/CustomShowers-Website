/**
 * Square Shower Configurator Types
 */

export type SquareScreen = 'template-select' | 'customise' | 'dimensions' | 'confirmation';

export type PlaneType = 'front' | 'return_left' | 'return_right' | 'back';

export type PanelType = 'fixed' | 'door_hinged';

export type TopEdgeType = 'level' | 'sloped';

export type HingeType = 'wall-to-glass' | 'glass-to-glass-180' | 'glass-to-glass-90' | 'glass-to-glass-135';

export type HingeBrand = 'geneva' | 'vienna' | 'bellagio';

export type MountingStyle = 'channel' | 'clamps';

export type SupportBarMountType = 'glass_to_wall' | 'glass_to_ceiling';

// Hinge limits by brand
export const HINGE_LIMITS: Record<HingeBrand, { maxWeight: number; maxWidth: number }> = {
    geneva: { maxWeight: 36, maxWidth: 711 },
    vienna: { maxWeight: 50, maxWidth: 914 },
    bellagio: { maxWeight: 50, maxWidth: 1000 }
};

// Glass thickness options
export type GlassThickness = 6 | 8 | 10;

// Weight per m² by glass thickness
export const GLASS_WEIGHT_PER_M2: Record<GlassThickness, number> = {
    6: 15,   // 6mm = 15kg per m²
    8: 20,   // 8mm = 20kg per m²
    10: 25   // 10mm = 25kg per m²
};

// Calculate glass weight
export function calculateGlassWeight(widthMm: number, heightMm: number, thicknessMm: GlassThickness = 10): number {
    const areaM2 = (widthMm / 1000) * (heightMm / 1000);
    const weightPerM2 = GLASS_WEIGHT_PER_M2[thicknessMm];
    return Math.round(areaM2 * weightPerM2 * 10) / 10;
}

// Auto-select hinge based on door dimensions
export function selectHingeBrand(doorWidthMm: number, doorWeightKg: number): HingeBrand {
    if (doorWidthMm <= HINGE_LIMITS.geneva.maxWidth && doorWeightKg <= HINGE_LIMITS.geneva.maxWeight) {
        return 'geneva';
    }
    if (doorWidthMm <= HINGE_LIMITS.vienna.maxWidth && doorWeightKg <= HINGE_LIMITS.vienna.maxWeight) {
        return 'vienna';
    }
    if (doorWidthMm <= HINGE_LIMITS.bellagio.maxWidth && doorWeightKg <= HINGE_LIMITS.bellagio.maxWeight) {
        return 'bellagio';
    }
    // Default to bellagio for oversized (will show warning)
    return 'bellagio';
}

// Support Panel (6mm glass strap for narrow fixed panels)
export interface SupportPanel {
    required: boolean;
    thickness_mm: 6;
    strap_width_mm: 10;
    head_deduction_mm: 0 | 4;
    spans_between: {
        from_panel_id: string | null;
        to_panel_id: string | null;
    };
    span_mm: number | null;
    notes: string;
}

// Support Bar (metal bar for wide return panels)
export interface SupportBar {
    bar_id: string;
    panel_id: string;
    required: boolean;
    reason: string;
    mount_type: SupportBarMountType;
    notes: string;
}

export interface PanelWallFix {
    left: boolean;
    right: boolean;
}

export interface PanelNotches {
    bottom_left: boolean;
    bottom_right: boolean;
    width_mm: number | null;
    height_mm: number | null;
}

export interface PanelTopEdge {
    type: TopEdgeType;
    direction: 'left' | 'right' | null;
    drop_mm: number | null;
}

export interface PanelModel {
    panel_id: string;
    panel_type: PanelType;
    plane: PlaneType;
    position_index: number;
    hinge_side: 'left' | 'right' | null;
    hinge_type?: HingeType | null;
    hinge_brand?: HingeBrand;  // Auto-selected based on door size/weight
    handle_side: 'left' | 'right' | null;
    notches: PanelNotches;
    top_edge: PanelTopEdge;
    mounting_style: MountingStyle;
    wall_fix: PanelWallFix;
    door_swing?: 'inward' | 'outward' | 'both' | null;
    width_mm?: number;
    height_mm?: number;
}

export type JunctionType = 'glass_to_glass' | 'wall_to_glass';

export interface JunctionModel {
    junction_id: string;
    a_panel_id: string;
    a_edge: 'left' | 'right';
    b_panel_id: string;
    b_edge: 'left' | 'right';
    angle_deg: number;
    junction_type: JunctionType;
}

export type SquareHeightMode = 'standard' | 'floor_to_ceiling';

export type SquareThresholdType = 'none' | 'clear_threshold' | 'tapered_threshold';

export type SquareHardwareFinish = 'chrome' | 'matte_black' | 'brushed_nickel' | 'brushed_brass';

export interface SquareState {
    baseType: string;
    doorVariant: 'left' | 'right' | 'double';
    mountingType: 'channel' | 'clamps';
    mountingSide: 'left' | 'right';
    height_mode: SquareHeightMode | null;
    seals_required: boolean | null;
    threshold_type: SquareThresholdType | null;
    hardware_finish: SquareHardwareFinish;
    ceiling_air_gap_mm: number;
    measurements: Record<string, number>;
    derived: Record<string, any>;
    deductions: Record<string, any>;
    warnings: string[];
    // New fields for template flow
    realWidthMm: number;
    realHeightMm: number;
    floorRake?: { amount: number; direction: 'left' | 'right' };
    wallRake?: { amount: number; direction: 'in' | 'out' };
    // Ceiling rake (for sloped ceilings)
    ceilingRake?: { left_height_mm: number; right_height_mm: number };
    // Support structures
    support_panel: SupportPanel;
    support_bars: SupportBar[];
    notches: Array<{ corner: string; widthMm: number; heightMm: number }>;
    slopedTop?: { leftMm: number; rightMm: number };
    isFloorToCeiling: boolean;
}

export interface SquareConfigOutput {
    screen: SquareScreen;
    family: 'square';
    return_angle_deg: number;
    auto_build: boolean;
    description_parsed: string;
    panels: PanelModel[];
    junctions: JunctionModel[];
    preview: {
        asset_id: string | null;
        hardware_colour: string;
        active_panel_id: string | null;
        active_junction_id: string | null;
        overlays: any[];
    };
    state: SquareState;
    next_required_inputs: string[];
    questions: string[];
}

export interface ParsedLayout {
    panels: PanelModel[];
    junctions: JunctionModel[];
    description: string;
}

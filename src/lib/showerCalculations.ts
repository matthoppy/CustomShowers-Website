/**
 * Shower Glass Fabrication Calculations
 * Based on SHOWER_DESIGN_RULES.md knowledge document
 */

import {
    PanelModel,
    MountingStyle,
    GlassThickness,
    HingeBrand,
    calculateGlassWeight,
    selectHingeBrand,
    HINGE_LIMITS
} from '@/types/square';

// ============================================================================
// CONSTANTS
// ============================================================================

// Glass
export const GLASS_THICKNESS_MM = 10;

// Channel Deductions
export const CHANNEL_DEPTH_MM = 19;
export const CHANNEL_VERTICAL_DEDUCTION_MM = 10;
export const CHANNEL_HORIZONTAL_DEDUCTION_MM = 5;
export const CHANNEL_FLOOR_TO_CEILING_DEDUCTION_MM = 12;

// Clamp Deductions
export const CLAMP_DEDUCTION_MM = 3;

// Corner/Joint Deductions
export const SILICONE_GAP_MM = 2;
export const CHANNEL_THICKNESS_MM = 1;
export const CORNER_LONG_PANEL_DEDUCTION_MM = 1;   // Channel thickness only
export const CORNER_SHORT_PANEL_DEDUCTION_MM = 13; // 2mm silicone + 10mm glass + 1mm channel

// Door Deductions
export const DOOR_BI_SWING_DEDUCTION_MM = 9;   // With bubble seal
export const DOOR_OUT_ONLY_DEDUCTION_MM = 5;   // With 90° stopper seal

// Hinge Placement
export const HINGE_CUTOUT_HEIGHT_MM = 60;
export const HINGE_MIN_EDGE_OFFSET_MM = 230;
export const HINGE_MAX_EDGE_OFFSET_MM = 300;
export const HINGE_MIN_CLEAR_GAP_MM = 400;

// Handle Placement
export const HANDLE_EDGE_CLEARANCE_MM = 75;
export const HANDLE_HOLE_SPACING_MM = 203;     // 8 inch
export const HANDLE_HOLE_DIAMETER_MM = 70;
export const KNOB_CENTER_TARGET_MM = 950;
export const HANDLE_BOTTOM_TARGET_MM = 850;

// Support Structures
export const SUPPORT_PANEL_HEAD_DEDUCTION_MM = 4;
export const NARROW_FIXED_PANEL_THRESHOLD_MM = 200;
export const WIDE_RETURN_PANEL_THRESHOLD_MM = 1200;

// ============================================================================
// DEDUCTION CALCULATIONS
// ============================================================================

export interface VerticalDeductions {
    top: number;
    bottom: number;
    total: number;
    breakdown: string[];
}

export interface HorizontalDeductions {
    left: number;
    right: number;
    total: number;
    breakdown: string[];
}

export interface PanelDeductions {
    vertical: VerticalDeductions;
    horizontal: HorizontalDeductions;
    cutWidth: number;
    cutHeight: number;
}

/**
 * Calculate vertical (height) deductions for a panel
 */
export function calculateVerticalDeductions(
    mountingStyle: MountingStyle,
    isFloorToCeiling: boolean,
    hasTopChannel: boolean,
    hasBottomChannel: boolean,
    supportPanelRequired: boolean = false
): VerticalDeductions {
    const breakdown: string[] = [];
    let top = 0;
    let bottom = 0;

    if (mountingStyle === 'channel') {
        if (isFloorToCeiling) {
            // Floor-to-ceiling requires larger deduction for installation
            if (hasTopChannel) {
                top = CHANNEL_FLOOR_TO_CEILING_DEDUCTION_MM;
                breakdown.push(`Top channel (F2C): -${top}mm`);
            }
            if (hasBottomChannel) {
                bottom = CHANNEL_FLOOR_TO_CEILING_DEDUCTION_MM;
                breakdown.push(`Bottom channel (F2C): -${bottom}mm`);
            }
        } else {
            // Standard installation
            if (hasTopChannel) {
                top = CHANNEL_VERTICAL_DEDUCTION_MM;
                breakdown.push(`Top channel: -${top}mm`);
            }
            if (hasBottomChannel) {
                bottom = CHANNEL_VERTICAL_DEDUCTION_MM;
                breakdown.push(`Bottom channel: -${bottom}mm`);
            }
        }
    } else {
        // Clamps
        if (hasTopChannel) {
            top = CLAMP_DEDUCTION_MM;
            breakdown.push(`Top clamps: -${top}mm`);
        }
        if (hasBottomChannel) {
            bottom = CLAMP_DEDUCTION_MM;
            breakdown.push(`Bottom clamps: -${bottom}mm`);
        }
    }

    // Support panel deduction (affects door height)
    if (supportPanelRequired) {
        top += SUPPORT_PANEL_HEAD_DEDUCTION_MM;
        breakdown.push(`Support panel clearance: -${SUPPORT_PANEL_HEAD_DEDUCTION_MM}mm`);
    }

    return {
        top,
        bottom,
        total: top + bottom,
        breakdown
    };
}

/**
 * Calculate horizontal (width) deductions for a panel
 */
export function calculateHorizontalDeductions(
    mountingStyle: MountingStyle,
    hasLeftWallChannel: boolean,
    hasRightWallChannel: boolean,
    isLongPanel: boolean,  // At corner: front panel is "long", return is "short"
    hasLeftCorner: boolean,
    hasRightCorner: boolean
): HorizontalDeductions {
    const breakdown: string[] = [];
    let left = 0;
    let right = 0;

    // Wall channel deductions
    if (mountingStyle === 'channel') {
        if (hasLeftWallChannel) {
            left += CHANNEL_HORIZONTAL_DEDUCTION_MM;
            breakdown.push(`Left wall channel: -${CHANNEL_HORIZONTAL_DEDUCTION_MM}mm`);
        }
        if (hasRightWallChannel) {
            right += CHANNEL_HORIZONTAL_DEDUCTION_MM;
            breakdown.push(`Right wall channel: -${CHANNEL_HORIZONTAL_DEDUCTION_MM}mm`);
        }
    } else {
        // Clamps
        if (hasLeftWallChannel) {
            left += CLAMP_DEDUCTION_MM;
            breakdown.push(`Left clamps: -${CLAMP_DEDUCTION_MM}mm`);
        }
        if (hasRightWallChannel) {
            right += CLAMP_DEDUCTION_MM;
            breakdown.push(`Right clamps: -${CLAMP_DEDUCTION_MM}mm`);
        }
    }

    // Corner deductions
    if (hasLeftCorner) {
        const deduction = isLongPanel ? CORNER_LONG_PANEL_DEDUCTION_MM : CORNER_SHORT_PANEL_DEDUCTION_MM;
        left += deduction;
        breakdown.push(`Left corner (${isLongPanel ? 'long' : 'short'}): -${deduction}mm`);
    }
    if (hasRightCorner) {
        const deduction = isLongPanel ? CORNER_LONG_PANEL_DEDUCTION_MM : CORNER_SHORT_PANEL_DEDUCTION_MM;
        right += deduction;
        breakdown.push(`Right corner (${isLongPanel ? 'long' : 'short'}): -${deduction}mm`);
    }

    return {
        left,
        right,
        total: left + right,
        breakdown
    };
}

/**
 * Calculate door-specific deductions
 */
export function calculateDoorDeductions(
    swingType: 'bi-swing' | 'out-only',
    hingeSide: 'left' | 'right'
): { deduction: number; sealType: string } {
    if (swingType === 'bi-swing') {
        return {
            deduction: DOOR_BI_SWING_DEDUCTION_MM,
            sealType: 'bubble seal'
        };
    } else {
        return {
            deduction: DOOR_OUT_ONLY_DEDUCTION_MM,
            sealType: '90° stopper seal'
        };
    }
}

/**
 * Calculate complete panel deductions and cut size
 */
export function calculatePanelDeductions(
    tightWidthMm: number,
    tightHeightMm: number,
    panel: PanelModel,
    isFloorToCeiling: boolean = false,
    supportPanelRequired: boolean = false,
    cornerConfig: {
        isLongPanel: boolean;
        hasLeftCorner: boolean;
        hasRightCorner: boolean;
    } = { isLongPanel: true, hasLeftCorner: false, hasRightCorner: false }
): PanelDeductions {
    const vertical = calculateVerticalDeductions(
        panel.mounting_style,
        isFloorToCeiling,
        true,  // hasTopChannel - typically always true
        true,  // hasBottomChannel - typically always true
        panel.panel_type === 'door_hinged' && supportPanelRequired
    );

    const horizontal = calculateHorizontalDeductions(
        panel.mounting_style,
        panel.wall_fix.left,
        panel.wall_fix.right,
        cornerConfig.isLongPanel,
        cornerConfig.hasLeftCorner,
        cornerConfig.hasRightCorner
    );

    return {
        vertical,
        horizontal,
        cutWidth: tightWidthMm - horizontal.total,
        cutHeight: tightHeightMm - vertical.total
    };
}

// ============================================================================
// HINGE PLACEMENT
// ============================================================================

export interface HingePlacement {
    topHingeOffset: number;    // Distance from top edge to center of top hinge
    bottomHingeOffset: number; // Distance from bottom edge to center of bottom hinge
    clearGap: number;          // Space between hinges
    warning: string | null;
}

/**
 * Calculate hinge placement (edge-based, 2-hinge system)
 * 
 * Target: 14% of height from each edge, clamped to 230-300mm
 * Hinge cutout height: 60mm
 */
export function calculateHingePlacement(glassHeightMm: number): HingePlacement {
    // Calculate 14% offset
    let offset = Math.round(glassHeightMm * 0.14);

    // Clamp to valid range
    offset = Math.max(HINGE_MIN_EDGE_OFFSET_MM, Math.min(HINGE_MAX_EDGE_OFFSET_MM, offset));

    // Calculate clear gap between hinges
    const clearGap = glassHeightMm - (2 * offset) - (2 * (HINGE_CUTOUT_HEIGHT_MM / 2));

    // Warning if gap is too small
    let warning: string | null = null;
    if (clearGap < HINGE_MIN_CLEAR_GAP_MM) {
        warning = `Hinge clear gap (${clearGap}mm) is less than ${HINGE_MIN_CLEAR_GAP_MM}mm minimum`;
    }

    return {
        topHingeOffset: offset,
        bottomHingeOffset: offset,
        clearGap,
        warning
    };
}

// ============================================================================
// HANDLE PLACEMENT
// ============================================================================

export interface HandlePlacement {
    handleHeight: number;      // Height to center/bottom of handle
    edgeClearance: number;     // Distance from edge of glass
    isValid: boolean;
    warning: string | null;
}

/**
 * Calculate handle placement (centre-based for knobs, bottom for pull handles)
 */
export function calculateHandlePlacement(
    glassHeightMm: number,
    handleType: 'knob' | 'pull_handle',
    hingePlacement: HingePlacement
): HandlePlacement {
    let targetHeight: number;

    if (handleType === 'knob') {
        // Knob: center at 950mm from bottom
        targetHeight = KNOB_CENTER_TARGET_MM;
    } else {
        // Pull handle: bottom at 850mm from bottom
        targetHeight = HANDLE_BOTTOM_TARGET_MM;
    }

    // Check for interference with hinges
    const bottomHingeTop = hingePlacement.bottomHingeOffset + (HINGE_CUTOUT_HEIGHT_MM / 2);
    const topHingeBottom = glassHeightMm - hingePlacement.topHingeOffset - (HINGE_CUTOUT_HEIGHT_MM / 2);

    let warning: string | null = null;
    let isValid = true;

    // Handle extends from targetHeight to targetHeight + HANDLE_HOLE_SPACING_MM (for pull handle)
    const handleTop = handleType === 'pull_handle'
        ? targetHeight + HANDLE_HOLE_SPACING_MM
        : targetHeight + 25; // knob radius

    if (targetHeight < bottomHingeTop + 50 || handleTop > topHingeBottom - 50) {
        warning = 'Handle position may conflict with hinge location';
        isValid = false;
    }

    return {
        handleHeight: targetHeight,
        edgeClearance: HANDLE_EDGE_CLEARANCE_MM,
        isValid,
        warning
    };
}

// ============================================================================
// SUPPORT STRUCTURE CHECKS
// ============================================================================

export interface SupportCheck {
    supportPanelRequired: boolean;
    supportPanelReason: string | null;
    supportBarRequired: boolean;
    supportBarReason: string | null;
    supportBarPanelId: string | null;
}

/**
 * Check if support structures are needed based on panel configuration
 */
export function checkSupportRequirements(
    panels: PanelModel[],
    isSquareShower: boolean = true
): SupportCheck {
    const result: SupportCheck = {
        supportPanelRequired: false,
        supportPanelReason: null,
        supportBarRequired: false,
        supportBarReason: null,
        supportBarPanelId: null
    };

    if (!isSquareShower) return result;

    // Find door panels
    const doorPanels = panels.filter(p => p.panel_type === 'door_hinged');
    const returnPanels = panels.filter(p =>
        p.plane === 'return_left' || p.plane === 'return_right'
    );

    // Check for support panel need (narrow adjacent fixed panel)
    for (const door of doorPanels) {
        const adjacentPanels = panels.filter(p =>
            p.panel_type === 'fixed' &&
            Math.abs(p.position_index - door.position_index) === 1
        );

        for (const adjacent of adjacentPanels) {
            if (adjacent.width_mm && adjacent.width_mm <= NARROW_FIXED_PANEL_THRESHOLD_MM) {
                result.supportPanelRequired = true;
                result.supportPanelReason = `Narrow fixed panel ${adjacent.panel_id} (${adjacent.width_mm}mm) adjacent to door`;
                break;
            }
        }
    }

    // Check for support bar need (wide return panel)
    for (const returnPanel of returnPanels) {
        if (returnPanel.width_mm && returnPanel.width_mm >= WIDE_RETURN_PANEL_THRESHOLD_MM) {
            // Check if it's "on its own" (not tied into other structure)
            const hasSupportPanelTieIn = result.supportPanelRequired;

            if (!hasSupportPanelTieIn) {
                result.supportBarRequired = true;
                result.supportBarReason = `Return panel ${returnPanel.panel_id} is ${returnPanel.width_mm}mm+ and free-standing`;
                result.supportBarPanelId = returnPanel.panel_id;
                break;
            }
        }
    }

    return result;
}

// ============================================================================
// HINGE BRAND SELECTION
// ============================================================================

export interface HingeSelection {
    brand: HingeBrand;
    isAutoSelected: boolean;
    isUpgrade: boolean;
    reason: string;
    warning: string | null;
}

/**
 * Select appropriate hinge brand based on door dimensions
 */
export function selectHingeForDoor(
    doorWidthMm: number,
    doorHeightMm: number,
    glassThickness: GlassThickness = 10
): HingeSelection {
    const weight = calculateGlassWeight(doorWidthMm, doorHeightMm, glassThickness);
    const brand = selectHingeBrand(doorWidthMm, weight);

    let isUpgrade = brand !== 'geneva';
    let reason = '';
    let warning: string | null = null;

    if (brand === 'geneva') {
        reason = 'Standard Geneva hinge sufficient';
    } else if (brand === 'vienna') {
        reason = `Door size requires Vienna (${doorWidthMm}mm width or ${weight}kg weight exceeds Geneva limits)`;
    } else if (brand === 'bellagio') {
        reason = `Door size requires Bellagio (${doorWidthMm}mm width or ${weight}kg weight exceeds Vienna limits)`;

        if (doorWidthMm > HINGE_LIMITS.bellagio.maxWidth || weight > HINGE_LIMITS.bellagio.maxWeight) {
            warning = `Door exceeds maximum hinge capacity (${HINGE_LIMITS.bellagio.maxWidth}mm / ${HINGE_LIMITS.bellagio.maxWeight}kg)`;
        }
    }

    return {
        brand,
        isAutoSelected: true,
        isUpgrade,
        reason,
        warning
    };
}

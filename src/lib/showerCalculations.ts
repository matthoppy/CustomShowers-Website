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
import { cornerButtDeductionMm, selectHinge } from '@/configurator/rules';

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
// At a 90° butt joint the run carrying the door passes through to the outside
// corner and loses nothing; the return tucks in behind it and loses the full
// glass thickness plus the silicone joint. See configurator/rules.ts.
export const CORNER_LONG_PANEL_DEDUCTION_MM = 0;

// Door Deductions
export const DOOR_BI_SWING_DEDUCTION_MM = 9;   // With bubble seal
export const DOOR_OUT_ONLY_DEDUCTION_MM = 5;   // With 90° stopper seal

// Hinge Placement
export const HINGE_CUTOUT_HEIGHT_MM = 47;      // Edge notch 58 × 47 r8
export const HINGE_EDGE_OFFSET_MM = 250;       // From each end of the door glass
export const HINGE_MIN_CLEAR_GAP_MM = 400;

// Handle Placement
export const HANDLE_EDGE_CLEARANCE_MM = 76;    // Hole centre in from the edge
export const HANDLE_HOLE_SPACING_MM = 203;     // 8 inch
export const HANDLE_HOLE_DIAMETER_MM = 12;
export const KNOB_CENTER_TARGET_MM = 950;

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
    hasRightCorner: boolean,
    glassThicknessMm: GlassThickness = GLASS_THICKNESS_MM as GlassThickness
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

    // Corner deductions. The run carrying the door passes through to the
    // outside corner and loses nothing; the return butts in behind it and
    // loses the glass thickness plus the silicone joint.
    const cornerDeduction = isLongPanel
        ? CORNER_LONG_PANEL_DEDUCTION_MM
        : cornerButtDeductionMm(glassThicknessMm);
    if (hasLeftCorner) {
        left += cornerDeduction;
        breakdown.push(
            `Left corner (${isLongPanel ? 'runs through' : 'butts behind'}): -${cornerDeduction}mm`
        );
    }
    if (hasRightCorner) {
        right += cornerDeduction;
        breakdown.push(
            `Right corner (${isLongPanel ? 'runs through' : 'butts behind'}): -${cornerDeduction}mm`
        );
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
        glassThicknessMm?: GlassThickness;
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
        cornerConfig.hasRightCorner,
        cornerConfig.glassThicknessMm
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
 * Hinges sit a fixed 250mm from the top and bottom of the door glass — not a
 * percentage of the height. Confirmed against CRL's own designer: a 1990mm
 * door and a 2290mm door both place their hinges at 250mm.
 *
 * Hinge cutout: edge notch 58 × 47 r8.
 */
export function calculateHingePlacement(glassHeightMm: number): HingePlacement {
    const offset = HINGE_EDGE_OFFSET_MM;

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
 * Calculate handle placement.
 *
 * A pull handle is centred vertically on the leaf — its two Ø12 holes sit
 * 203mm apart, straddling the centre, 76mm in from the handle edge. On a
 * 1990mm door that puts them at 893.5mm and 1096.5mm.
 *
 * A knob keeps its fixed 950mm height, which is a comfortable grab height
 * regardless of how tall the door is.
 */
export function calculateHandlePlacement(
    glassHeightMm: number,
    handleType: 'knob' | 'pull_handle',
    hingePlacement: HingePlacement
): HandlePlacement {
    // Handle extent, measured from the bottom of the glass.
    const centre = handleType === 'knob' ? KNOB_CENTER_TARGET_MM : glassHeightMm / 2;
    const halfSpan = handleType === 'knob' ? 25 : HANDLE_HOLE_SPACING_MM / 2;
    const handleBottom = centre - halfSpan;
    const handleTop = centre + halfSpan;

    // Check for interference with hinges
    const bottomHingeTop = hingePlacement.bottomHingeOffset + (HINGE_CUTOUT_HEIGHT_MM / 2);
    const topHingeBottom = glassHeightMm - hingePlacement.topHingeOffset - (HINGE_CUTOUT_HEIGHT_MM / 2);

    let warning: string | null = null;
    let isValid = true;

    if (handleBottom < bottomHingeTop + 50 || handleTop > topHingeBottom - 50) {
        warning = 'Handle position may conflict with hinge location';
        isValid = false;
    }

    return {
        handleHeight: Math.round(centre * 10) / 10,
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
    brand: string;
    /** How many hinges the rating assumes — a third hinge raises the limits. */
    hingeCount: number;
    weightKg: number;
    isAutoSelected: boolean;
    reason: string;
    warnings: string[];
}

/**
 * Select appropriate hinge hardware based on door dimensions.
 *
 * The real limits — and the fact that a third hinge changes them — live in
 * configurator/rules.ts alongside the rest of the confirmed CRL data.
 */
export function selectHingeForDoor(
    doorWidthMm: number,
    doorHeightMm: number,
    glassThickness: GlassThickness = 10
): HingeSelection {
    const picked = selectHinge(doorWidthMm, doorHeightMm, glassThickness);
    return {
        brand: picked.kitName,
        hingeCount: picked.hingeCount,
        weightKg: picked.weightKg,
        isAutoSelected: true,
        reason: picked.reason,
        warnings: picked.warnings
    };
}

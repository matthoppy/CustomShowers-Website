import { MountingMethod } from './shower-logic';

interface DimensionInput {
    tightWidth: number;
    tightHeight: number;
    mountingMethod: MountingMethod;
    isCeilingFixed?: boolean;
    hasThreshold?: boolean;
    sealType?: string; // e.g., 'magnetic'
}

export interface GlassDeductions {
    glassWidth: number;
    glassHeight: number;
    deductionWidth: number;
    deductionHeight: number;
    weight?: number;
    notes: string[];
}

// Deduction Constants (in mm)
const CLAMP_GAP = 3;

// Channel Deductions (User specified)
const CHANNEL_WALL_DEDUCTION = 10; // Width deduction per side
const CHANNEL_FLOOR_DEDUCTION = 5; // Height deduction (bottom only)
const CHANNEL_CEILING_DEDUCTION_PER_SIDE = 6; // Height deduction (6mm top + 6mm bottom if F2C)

const HINGE_GAP_SIDE_WALL = 4; // Standard wall hinge gap
const HINGE_GAP_SIDE_GLASS = 4; // Standard glass hinge gap (BEL380 is ~3-8mm depending on seal)
const HINGE_GAP_DOOR_BOTTOM_DRIP = 10; // Drip rail only (P990WS)
const HINGE_GAP_DOOR_BOTTOM_THRESHOLD = 16; // Drip rail + Threshold
const HINGE_GAP_DOOR_TOP = 4; // Clearance

// Specific Hinge Gaps
const GENEVA_WALL_GAP = 4;
const BELLAGIO_WALL_GAP_NO_SEAL = 3;
const BELLAGIO_WALL_GAP_WITH_SEAL = 8;


const DENSITY_FACTOR = 2.5; // kg per m2 per mm

export function calculateGlassWeight(widthMm: number, heightMm: number, thicknessMm: number): number {
    const areaM2 = (widthMm / 1000) * (heightMm / 1000);
    return areaM2 * thicknessMm * DENSITY_FACTOR;
}

export function calculatePanelDeductions(
    type: 'fixed' | 'door',
    dimensions: DimensionInput
): GlassDeductions {
    const { tightWidth, tightHeight, mountingMethod, isCeilingFixed } = dimensions;
    const notes: string[] = [];

    let widthDeduction = 0;
    let heightDeduction = 0;

    if (type === 'fixed') {
        if (mountingMethod === 'clamps') {
            // Clamps: 3mm gap at wall + 3mm gap at bottom
            widthDeduction = CLAMP_GAP;
            heightDeduction = CLAMP_GAP;

            notes.push(`Clamp Mounting: -${CLAMP_GAP}mm width (wall gap)`);
            notes.push(`Clamp Mounting: -${CLAMP_GAP}mm height (floor gap)`);
        } else {
            // Channel: 
            // Width: -10mm per wall side
            widthDeduction = CHANNEL_WALL_DEDUCTION;
            notes.push(`Channel Mounting: -${CHANNEL_WALL_DEDUCTION}mm width (wall channel)`);

            // Height:
            if (isCeilingFixed) {
                // Floor to Ceiling: 6mm top + 6mm bottom
                heightDeduction = CHANNEL_CEILING_DEDUCTION_PER_SIDE * 2;
                notes.push(`Channel Mounting (F2C): -${heightDeduction}mm height (6mm top + 6mm bottom)`);
            } else {
                // Standard: 5mm bottom
                heightDeduction = CHANNEL_FLOOR_DEDUCTION;
                notes.push(`Channel Mounting: -${CHANNEL_FLOOR_DEDUCTION}mm height (floor channel)`);
            }
        }
    } else if (type === 'door') {
        // Door Logic
        // We need to know the Hinge Model to apply correct gaps
        // Defaulting to Geneva rules (4mm) for now if not specified
        // TODO: Pass HingeModel in future to make this dynamic

        // Standard Geneva Gap
        const hingeGap = HINGE_GAP_SIDE_WALL;
        let strikeGap = HINGE_GAP_SIDE_WALL;

        // Adjust strike gap for Magnetics
        if (dimensions.sealType === 'magnetic') {
            strikeGap = 11; // 7/16" gap for magnetic profiles
            notes.push(`Magnetic Seal: Using 11mm strike gap`);
        }

        widthDeduction = hingeGap + strikeGap;

        // Height: Tight - (Bottom Sweep + Top Clearance)
        // If threshold -> 16mm, Else -> 10mm (P990WS)
        const bottomGap = dimensions.hasThreshold ? HINGE_GAP_DOOR_BOTTOM_THRESHOLD : HINGE_GAP_DOOR_BOTTOM_DRIP;
        heightDeduction = bottomGap + HINGE_GAP_DOOR_TOP;

        notes.push(`Door Width: -${widthDeduction}mm (${hingeGap}mm Hinge + ${strikeGap}mm Strike)`);
        notes.push(`Door Height: -${heightDeduction}mm (Sweep/Clearance: ${bottomGap}mm + ${HINGE_GAP_DOOR_TOP}mm)`);
    }

    const weight = calculateGlassWeight(tightWidth - widthDeduction, tightHeight - heightDeduction, 10); // Assume 10mm

    return {
        glassWidth: tightWidth - widthDeduction,
        glassHeight: tightHeight - heightDeduction,
        deductionWidth: widthDeduction,
        deductionHeight: heightDeduction,
        weight: weight,
        notes
    };
}

/**
 * Fabrication spec builder.
 *
 * Turns the customer's configuration into the thing the glazier actually
 * receives: panel-by-panel cut sizes with the deductions spelled out, the
 * hardware that follows from the door size, and any warnings worth seeing
 * before glass is cut.
 *
 * All the real rules live in lib/showerCalculations.ts. This module's job is
 * to feed them correctly and lay the answers out in one flat structure that
 * the review screen and the email can both render.
 */

import type { PanelModel } from '@/types/square';
import {
  calculateDoorDeductions,
  calculateHandlePlacement,
  calculateHingePlacement,
  calculatePanelDeductions,
  checkSupportRequirements,
  selectHingeForDoor,
  type HandlePlacement,
  type HingePlacement,
  type PanelDeductions,
} from '@/lib/showerCalculations';
import { derivePlanes, type Plane, totalRunWidthMm } from './geometry';
import {
  CUTOUTS,
  checkDoorLimits,
  checkGlassSpec,
  checkPanelLimits,
  glassWeightKg,
  handleHoleHeightsMm,
  hingeHeightsMm,
  mateNotchHeightMm,
  type LimitCheck,
} from './rules';
import type { ConfiguratorState } from './types';

export interface PanelSpec {
  id: string;
  label: string;
  kind: 'fixed' | 'door';
  plane: Plane;
  /** What the customer measured. */
  tightWidthMm: number;
  tightHeightMm: number;
  /** What to cut, after deductions. */
  cutWidthMm: number;
  cutHeightMm: number;
  weightKg: number;
  deductions: PanelDeductions;
  notches: { corner: string; widthMm: number; heightMm: number }[];
  /**
   * Where the holes and notches go, measured from the glass edges. The
   * workshop cuts from these, so they travel with the panel rather than
   * being re-derived at the far end.
   */
  cutouts: {
    description: string;
    /** Height above the bottom edge of this panel's glass. */
    heightMm: number;
    edge: 'hinge side' | 'handle side';
  }[];
  /** Door-only. */
  door?: {
    hingeSide: 'left' | 'right';
    swing: 'out' | 'both';
    sealType: string;
    swingDeductionMm: number;
    hingeBrand: string;
    hingeCount: number;
    hingeReason: string;
    /** Hinge centres above the bottom of the door glass. */
    hingeHeightsMm: number[];
    hingePlacement: HingePlacement;
    handlePlacement: HandlePlacement;
    handleHoleHeightsMm: { lowerMm: number; upperMm: number };
  };
}

export interface ConfiguratorSpec {
  panels: PanelSpec[];
  cornerCount: number;
  totalRunWidthMm: number;
  wallRuns: { wall: string; widthMm: number }[];
  totalChannelLengthMm: number;
  heightMm: number;
  isFloorToCeiling: boolean;
  mounting: 'channel' | 'clamps';
  glassThicknessMm: number;
  totalGlassWeightKg: number;
  support: ReturnType<typeof checkSupportRequirements>;
  rakeNotes: string[];
  warnings: string[];
  /**
   * Things that stop the job rather than merely flag it — a door too wide for
   * any hinge we hang, a panel too narrow to fabricate. Kept apart from
   * warnings so the review screen can say "we can't build this as drawn"
   * rather than burying it in a list the customer scrolls past.
   */
  blockingIssues: string[];
}

/** Bridge the configurator's panel shape into the fabrication library's. */
function toPanelModel(
  state: ConfiguratorState,
  index: number,
  plane: Plane
): PanelModel {
  const p = state.panels[index];
  return {
    panel_id: p.id,
    panel_type: p.kind === 'door' ? 'door_hinged' : 'fixed',
    plane,
    position_index: index,
    hinge_side: p.door?.hinge_side ?? null,
    handle_side: p.door ? (p.door.hinge_side === 'left' ? 'right' : 'left') : null,
    notches: {
      bottom_left: p.notches?.bottom_left ?? false,
      bottom_right: p.notches?.bottom_right ?? false,
      width_mm: p.notches?.width_mm ?? null,
      height_mm: p.notches?.height_mm ?? null,
    },
    top_edge: { type: 'level', direction: null, drop_mm: null },
    mounting_style: state.mounting,
    wall_fix: {
      left: index === 0 && state.leftWall,
      right: index === state.panels.length - 1 && state.rightWall,
    },
    door_swing: p.door ? (p.door.swing === 'both' ? 'both' : 'outward') : null,
    width_mm: p.width_mm,
    height_mm: state.heightMm,
  };
}

function panelLabel(index: number, kind: 'fixed' | 'door', plane: Plane): string {
  const planeName =
    plane === 'return_left'
      ? 'Return left'
      : plane === 'return_right'
        ? 'Return right'
        : plane === 'back'
          ? 'Back'
          : 'Front';
  return `P${index + 1} — ${kind === 'door' ? 'Door' : 'Fixed'} (${planeName})`;
}

export function buildSpec(state: ConfiguratorState): ConfiguratorSpec {
  const planes = derivePlanes(state.panels, state.junctions);
  const panelModels = state.panels.map((_, i) => toPanelModel(state, i, planes[i]));
  const support = checkSupportRequirements(panelModels, state.junctions.some((j) => j.angle_deg === 90));

  const warnings: string[] = [];
  const blockingIssues: string[] = [];

  /** Route a limit check to the right list, prefixed with the panel it is about. */
  const record = (label: string, checks: LimitCheck[]) => {
    for (const c of checks) {
      (c.severity === 'blocking' ? blockingIssues : warnings).push(`${label}: ${c.message}`);
    }
  };

  record('Glass', checkGlassSpec(state.glassThicknessMm));

  const panels: PanelSpec[] = state.panels.map((p, i) => {
    const plane = planes[i];
    const model = panelModels[i];

    const hasLeftCorner = state.junctions[i - 1]?.angle_deg === 90;
    const hasRightCorner = state.junctions[i]?.angle_deg === 90;

    const deductions = calculatePanelDeductions(
      p.width_mm,
      state.heightMm,
      model,
      state.isFloorToCeiling,
      support.supportPanelRequired,
      {
        // At a corner the panel in the front plane runs long and the return
        // tucks behind it, so only one of the pair takes the glass thickness.
        isLongPanel: plane === 'front' || plane === 'back',
        hasLeftCorner,
        hasRightCorner,
        glassThicknessMm: state.glassThicknessMm,
      }
    );

    const notches: PanelSpec['notches'] = [];
    if (p.notches?.bottom_left) {
      notches.push({ corner: 'Bottom left', widthMm: p.notches.width_mm, heightMm: p.notches.height_mm });
    }
    if (p.notches?.bottom_right) {
      notches.push({ corner: 'Bottom right', widthMm: p.notches.width_mm, heightMm: p.notches.height_mm });
    }

    const spec: PanelSpec = {
      id: p.id,
      label: panelLabel(i, p.kind, plane),
      kind: p.kind,
      plane,
      tightWidthMm: p.width_mm,
      tightHeightMm: state.heightMm,
      cutWidthMm: deductions.cutWidth,
      cutHeightMm: deductions.cutHeight,
      weightKg: glassWeightKg(deductions.cutWidth, deductions.cutHeight, state.glassThicknessMm),
      deductions,
      notches,
      cutouts: [],
    };

    if (p.kind === 'door' && p.door) {
      const doorDeduction = calculateDoorDeductions(
        p.door.swing === 'both' ? 'bi-swing' : 'out-only',
        p.door.hinge_side
      );

      // The swing deduction comes off the door leaf on top of the mounting
      // deductions already applied above. Everything that follows is sized
      // against the finished leaf, so it has to happen first — picking a
      // hinge against the pre-deduction width is how a door ends up on
      // hardware a few millimetres under-rated.
      spec.cutWidthMm -= doorDeduction.deduction;
      spec.weightKg = glassWeightKg(spec.cutWidthMm, spec.cutHeightMm, state.glassThicknessMm);

      const hinge = selectHingeForDoor(spec.cutWidthMm, spec.cutHeightMm, state.glassThicknessMm);
      const hingePlacement = calculateHingePlacement(spec.cutHeightMm);
      const handlePlacement = calculateHandlePlacement(
        spec.cutHeightMm,
        state.handleId === 'knob' ? 'knob' : 'pull_handle',
        hingePlacement
      );
      const hingeHeights = hingeHeightsMm(spec.cutHeightMm, hinge.hingeCount);
      const handleHoles = handleHoleHeightsMm(spec.cutHeightMm);

      spec.door = {
        hingeSide: p.door.hinge_side,
        swing: p.door.swing,
        sealType: doorDeduction.sealType,
        swingDeductionMm: doorDeduction.deduction,
        hingeBrand: hinge.brand,
        hingeCount: hinge.hingeCount,
        hingeReason: hinge.reason,
        hingeHeightsMm: hingeHeights,
        hingePlacement,
        handlePlacement,
        handleHoleHeightsMm: { lowerMm: handleHoles.lowerMm, upperMm: handleHoles.upperMm },
      };

      for (const h of hingeHeights) {
        spec.cutouts.push({
          description: `Hinge notch ${CUTOUTS.doorHingeNotch.widthMm} × ${CUTOUTS.doorHingeNotch.heightMm}, r${CUTOUTS.doorHingeNotch.radiusMm}`,
          heightMm: h,
          edge: 'hinge side',
        });
      }
      if (state.handleId !== 'knob') {
        for (const h of [handleHoles.lowerMm, handleHoles.upperMm]) {
          spec.cutouts.push({
            description: `Handle hole Ø${CUTOUTS.handleHole.diameterMm}, ${CUTOUTS.handleHole.insetMm}mm in from the edge`,
            heightMm: h,
            edge: 'handle side',
          });
        }
      }

      for (const w of hinge.warnings) warnings.push(`${spec.label}: ${w}`);
      if (hingePlacement.warning) warnings.push(`${spec.label}: ${hingePlacement.warning}`);
      if (handlePlacement.warning) warnings.push(`${spec.label}: ${handlePlacement.warning}`);
      record(spec.label, checkDoorLimits(spec.cutWidthMm, spec.cutHeightMm));
    }

    record(
      spec.label,
      checkPanelLimits(
        spec.cutWidthMm,
        spec.cutHeightMm,
        state.glassThicknessMm,
        spec.cutouts.length > 0 || notches.length > 0
      )
    );

    if (spec.cutWidthMm <= 0 || spec.cutHeightMm <= 0) {
      warnings.push(`${spec.label}: deductions exceed the measured size — check the measurements.`);
    }

    return spec;
  });

  // Second pass: mating hinge notches in the fixed panel beside a door.
  //
  // These can only be worked out once every panel's bottom gap is known,
  // because the notch is set at the door hinge's height *above the floor*,
  // not at the same number measured from the fixed panel's own edge. The two
  // panels sit on different gaps — a door 10mm clear of the floor beside a
  // panel in a 7mm channel — so matching the printed numbers would put the
  // hinge leaves 3mm out of line.
  panels.forEach((doorSpec, i) => {
    if (!doorSpec.door) return;
    const neighbourIndex = doorSpec.door.hingeSide === 'left' ? i - 1 : i + 1;
    const neighbour = panels[neighbourIndex];
    // No neighbour means the door hangs off the wall on a wall-to-glass
    // hinge, which needs no glass processing on the other side.
    if (!neighbour || neighbour.kind !== 'fixed') return;

    for (const h of doorSpec.door.hingeHeightsMm) {
      neighbour.cutouts.push({
        description: `Hinge notch ${CUTOUTS.fixedHingeNotch.widthMm} × ${CUTOUTS.fixedHingeNotch.heightMm}, r${CUTOUTS.fixedHingeNotch.radiusMm} — mates with ${doorSpec.label}`,
        heightMm: mateNotchHeightMm(
          h,
          doorSpec.deductions.vertical.bottom,
          neighbour.deductions.vertical.bottom
        ),
        edge: doorSpec.door.hingeSide === 'left' ? 'handle side' : 'hinge side',
      });
    }
  });

  // The channel runs along the bottom of every panel, and up the height of
  // each notch where one is cut.
  const notchAllowance = panels.reduce(
    (sum, p) => sum + p.notches.reduce((n, notch) => n + notch.heightMm, 0),
    0
  );

  const rakeNotes: string[] = [];
  if (state.rakes.floor.direction !== 'none' && state.rakes.floor.amount_mm > 0) {
    rakeNotes.push(`Floor falls ${state.rakes.floor.amount_mm}mm to the ${state.rakes.floor.direction}.`);
  }
  if (state.rakes.leftWall.direction !== 'none' && state.rakes.leftWall.amount_mm > 0) {
    rakeNotes.push(`Left wall leans ${state.rakes.leftWall.direction} by ${state.rakes.leftWall.amount_mm}mm.`);
  }
  if (state.rakes.rightWall.direction !== 'none' && state.rakes.rightWall.amount_mm > 0) {
    rakeNotes.push(`Right wall leans ${state.rakes.rightWall.direction} by ${state.rakes.rightWall.amount_mm}mm.`);
  }

  if (support.supportPanelRequired && support.supportPanelReason) {
    warnings.push(`Support panel required: ${support.supportPanelReason}`);
  }
  if (support.supportBarRequired && support.supportBarReason) {
    warnings.push(`Support bar required: ${support.supportBarReason}`);
  }
  if (!state.panels.some((p) => p.kind === 'door')) {
    warnings.push('No door in this run — quoted as fixed panels only.');
  }

  // Calculate per-wall runs for corner units
  const wallRuns: { wall: string; widthMm: number }[] = [];
  const cornerCount = state.junctions.filter((j) => j.angle_deg === 90).length;
  
  if (cornerCount > 0) {
    // Group panels by wall based on corners
    let currentWallIndex = 0;
    let currentWallWidth = 0;
    
    state.panels.forEach((panel, i) => {
      currentWallWidth += panel.width_mm;
      
      // If there's a corner after this panel, save the wall and start a new one
      if (i < state.junctions.length && state.junctions[i].angle_deg === 90) {
        wallRuns.push({ 
          wall: `Wall ${currentWallIndex + 1}`, 
          widthMm: currentWallWidth 
        });
        currentWallIndex++;
        currentWallWidth = 0;
      }
    });
    
    // Add the final wall
    if (currentWallWidth > 0 || wallRuns.length === 0) {
      wallRuns.push({ 
        wall: `Wall ${currentWallIndex + 1}`, 
        widthMm: currentWallWidth 
      });
    }
  }

  return {
    panels,
    cornerCount,
    totalRunWidthMm: totalRunWidthMm(state.panels),
    wallRuns,
    totalChannelLengthMm: totalRunWidthMm(state.panels) + notchAllowance,
    heightMm: state.heightMm,
    isFloorToCeiling: state.isFloorToCeiling,
    mounting: state.mounting,
    glassThicknessMm: state.glassThicknessMm,
    totalGlassWeightKg: Math.round(panels.reduce((s, p) => s + p.weightKg, 0) * 10) / 10,
    support,
    rakeNotes,
    warnings,
    blockingIssues,
  };
}

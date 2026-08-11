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
import { calculateGlassWeight } from '@/types/square';
import { derivePlanes, type Plane, totalRunWidthMm } from './geometry';
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
  /** Door-only. */
  door?: {
    hingeSide: 'left' | 'right';
    swing: 'out' | 'both';
    sealType: string;
    swingDeductionMm: number;
    hingeBrand: string;
    hingeReason: string;
    hingePlacement: HingePlacement;
    handlePlacement: HandlePlacement;
  };
}

export interface ConfiguratorSpec {
  panels: PanelSpec[];
  cornerCount: number;
  totalRunWidthMm: number;
  totalChannelLengthMm: number;
  heightMm: number;
  isFloorToCeiling: boolean;
  mounting: 'channel' | 'clamps';
  glassThicknessMm: number;
  totalGlassWeightKg: number;
  support: ReturnType<typeof checkSupportRequirements>;
  rakeNotes: string[];
  warnings: string[];
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
      weightKg: calculateGlassWeight(deductions.cutWidth, deductions.cutHeight, state.glassThicknessMm),
      deductions,
      notches,
    };

    if (p.kind === 'door' && p.door) {
      const doorDeduction = calculateDoorDeductions(
        p.door.swing === 'both' ? 'bi-swing' : 'out-only',
        p.door.hinge_side
      );
      const hinge = selectHingeForDoor(deductions.cutWidth, deductions.cutHeight, state.glassThicknessMm);
      const hingePlacement = calculateHingePlacement(deductions.cutHeight);
      const handlePlacement = calculateHandlePlacement(
        deductions.cutHeight,
        state.handleId === 'knob' ? 'knob' : 'pull_handle',
        hingePlacement
      );

      spec.door = {
        hingeSide: p.door.hinge_side,
        swing: p.door.swing,
        sealType: doorDeduction.sealType,
        swingDeductionMm: doorDeduction.deduction,
        hingeBrand: hinge.brand,
        hingeReason: hinge.reason,
        hingePlacement,
        handlePlacement,
      };

      // The swing deduction comes off the door leaf on top of the mounting
      // deductions already applied above.
      spec.cutWidthMm -= doorDeduction.deduction;
      spec.weightKg = calculateGlassWeight(spec.cutWidthMm, spec.cutHeightMm, state.glassThicknessMm);

      if (hinge.warning) warnings.push(`${spec.label}: ${hinge.warning}`);
      if (hingePlacement.warning) warnings.push(`${spec.label}: ${hingePlacement.warning}`);
      if (handlePlacement.warning) warnings.push(`${spec.label}: ${handlePlacement.warning}`);
    }

    if (spec.cutWidthMm <= 0 || spec.cutHeightMm <= 0) {
      warnings.push(`${spec.label}: deductions exceed the measured size — check the measurements.`);
    }

    return spec;
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

  return {
    panels,
    cornerCount: state.junctions.filter((j) => j.angle_deg === 90).length,
    totalRunWidthMm: totalRunWidthMm(state.panels),
    totalChannelLengthMm: totalRunWidthMm(state.panels) + notchAllowance,
    heightMm: state.heightMm,
    isFloorToCeiling: state.isFloorToCeiling,
    mounting: state.mounting,
    glassThicknessMm: state.glassThicknessMm,
    totalGlassWeightKg: Math.round(panels.reduce((s, p) => s + p.weightKg, 0) * 10) / 10,
    support,
    rakeNotes,
    warnings,
  };
}

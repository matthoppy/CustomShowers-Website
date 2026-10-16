/**
 * Data-driven measurement plans per configuration.
 *
 * Trade practice: measure at BOTTOM first (widths at floor/tray level and bottom
 * wall gaps), then work UP the wall to the finished glass height.
 *
 * Each plan defines which walls, openings and returns to measure, in what order,
 * with illustrations and tips per step. The wizard renders the plan; the method
 * choice (tape/laser) adjusts steps within a plan.
 */

import type { MeasuringMethod } from './types';

export type HeightReference = 'grout-line' | 'door-frame' | 'ceiling' | 'standard';

export interface MeasurementStep {
  id: string;
  title: string;
  description: string;
  /** Brief plain-English guidance for this step. */
  tip: string;
  /** SVG illustration identifier (function that returns JSX). */
  illustrationId: string;
  /** Whether this step is required (false = optional/skippable). */
  required: boolean;
  /** Only shown in laser mode (e.g. wall rake measurements). */
  laserOnly?: boolean;
  /** Only shown in tape mode (e.g. spirit level check). */
  tapeOnly?: boolean;
}

export interface MeasurementPlan {
  /** Unique plan identifier matching configurator shape. */
  id: string;
  /** Human-readable plan name. */
  name: string;
  /** Brief description of this configuration. */
  description: string;
  /** Ordered measurement steps for this configuration. */
  steps: MeasurementStep[];
}

/**
 * Default standard glass height (mm) — most enclosures are 2000mm.
 * Configurable per project.
 */
export const DEFAULT_GLASS_HEIGHT_MM = 2000;

/**
 * Minimum clearance above shower head outlet (mm).
 * Glass top should be at least this much higher than the head.
 */
export const MIN_HEAD_CLEARANCE_MM = 100;

/**
 * Configuration-specific measurement plans.
 *
 * Each plan defines the correct sequence for that layout. Trade practice is
 * bottom-first: measure widths at floor/tray level, bottom wall gaps (laser),
 * then work up to the finished height.
 */
export const MEASUREMENT_PLANS: Record<string, MeasurementPlan> = {
  'alcove-door': {
    id: 'alcove-door',
    name: 'Single door (alcove)',
    description: 'Door only, between two walls',
    steps: [
      {
        id: 'opening-width-bottom',
        title: 'Opening width at the bottom',
        description: 'Measure wall to wall at floor or tray level',
        tip: 'Measure at the floor or tray surface. This is where the bottom channel sits.',
        illustrationId: 'alcove-width-bottom',
        required: true,
      },
      {
        id: 'opening-width-middle',
        title: 'Opening width at the middle',
        description: 'Measure wall to wall at waist height',
        tip: 'Around 1000mm up from the tray. Walls are rarely perfectly straight.',
        illustrationId: 'alcove-width-middle',
        required: true,
      },
      {
        id: 'opening-width-top',
        title: 'Opening width at the top',
        description: 'Measure wall to wall at the finished glass height',
        tip: 'At the height the glass will finish. We'll use the smallest of the three measurements.',
        illustrationId: 'alcove-width-top',
        required: true,
      },
      {
        id: 'laser-left-wall',
        title: 'Left wall: laser line to wall',
        description: 'Check if the left wall is plumb',
        tip: 'Project a vertical laser line parallel to the wall. Measure from the line to the wall at bottom, middle and top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'laser-right-wall',
        title: 'Right wall: laser line to wall',
        description: 'Check if the right wall is plumb',
        tip: 'Project a vertical laser line parallel to the wall. Measure from the line to the wall at bottom, middle and top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top of the glass finish?',
        tip: 'Choose a visual reference like a grout line, door frame top, or the ceiling.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference point',
        description: 'Measure from tray to your chosen reference',
        tip: 'Measure straight up from the tray or floor to the reference point you chose.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Height of the fixed head outlet or top of rail',
        tip: 'Measure from the tray to the outlet (fixed head) or the top of the rail (slider). The glass must clear the head.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Check walls with a spirit level',
        tip: 'Hold a level vertically against each wall. If it leans, note which way.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'What surface will the glass sit on?',
        tip: 'Tray, wet room floor, or over a bath edge.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling, pipework — anything that affects the glass.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'alcove-panel-door': {
    id: 'alcove-panel-door',
    name: 'Panel and door (alcove)',
    description: 'Fixed panel beside the door, wall to wall',
    // NEEDS TRADE REVIEW: Should we measure the full alcove width first,
    // or the panel width and door width separately? Does the fitter work
    // from the total and divide it, or measure each separately?
    steps: [
      {
        id: 'opening-width-bottom',
        title: 'Total opening width at the bottom',
        description: 'Full width wall to wall at floor level',
        tip: 'Measure the complete alcove width at the tray or floor.',
        illustrationId: 'alcove-width-bottom',
        required: true,
      },
      {
        id: 'opening-width-middle',
        title: 'Total opening width at the middle',
        description: 'Full width wall to wall at waist height',
        tip: 'Around 1000mm up. Measure the full alcove width.',
        illustrationId: 'alcove-width-middle',
        required: true,
      },
      {
        id: 'opening-width-top',
        title: 'Total opening width at the top',
        description: 'Full width wall to wall at glass height',
        tip: 'At the finished glass height. Smallest of the three measurements is used.',
        illustrationId: 'alcove-width-top',
        required: true,
      },
      {
        id: 'laser-left-wall',
        title: 'Left wall: laser line to wall',
        description: 'Check if the left wall is plumb',
        tip: 'Vertical laser line parallel to the wall. Measure gaps at bottom, middle, top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'laser-right-wall',
        title: 'Right wall: laser line to wall',
        description: 'Check if the right wall is plumb',
        tip: 'Vertical laser line parallel to the wall. Measure gaps at bottom, middle, top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top of the glass finish?',
        tip: 'Grout line, door frame, ceiling, or a standard height.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference point',
        description: 'Measure from tray to reference',
        tip: 'Straight up from tray to the reference point.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or top of rail height',
        tip: 'From tray to the head outlet or rail top. Glass must clear it.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Spirit level against walls',
        tip: 'Check both walls with a level if available.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'Surface type',
        tip: 'Tray, wet room, or over bath.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling, pipework.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'walk-in': {
    id: 'walk-in',
    name: 'Walk-in screen',
    description: 'Single fixed panel, no door',
    // NEEDS TRADE REVIEW: For a walk-in anchored at one end, do we measure
    // the wall width first, or just the panel width and wall plumb? Does the
    // wall width matter if the panel doesn't span it?
    steps: [
      {
        id: 'panel-width-bottom',
        title: 'Panel width at the bottom',
        description: 'Measure panel width at floor level',
        tip: 'How wide the fixed panel should be, measured at the tray or floor.',
        illustrationId: 'panel-width-bottom',
        required: true,
      },
      {
        id: 'panel-width-top',
        title: 'Panel width at the top',
        description: 'Measure panel width at glass height',
        tip: 'At the finished height. Use the smaller of top and bottom.',
        illustrationId: 'panel-width-top',
        required: true,
      },
      {
        id: 'laser-anchor-wall',
        title: 'Anchor wall: laser line to wall',
        description: 'Check if the anchor wall is plumb',
        tip: 'Vertical laser line parallel to the wall the panel attaches to. Measure gaps at bottom, middle, top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top finish?',
        tip: 'Grout line, door frame, ceiling, or standard height.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference',
        description: 'Tray to reference point',
        tip: 'Straight up from tray.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or rail top',
        tip: 'From tray to head outlet or rail top.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Spirit level',
        tip: 'Check the anchor wall with a level.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'Surface type',
        tip: 'Tray or wet room floor.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'walk-in-return': {
    id: 'walk-in-return',
    name: 'Walk-in with return',
    description: 'Walk-in screen with a short return panel',
    // NEEDS TRADE REVIEW: Measure order for L-shaped walk-in: main panel
    // width first, then return width? Or back wall width, then front panel,
    // then return? Does the corner junction measurement come before or after
    // the individual panel widths?
    steps: [
      {
        id: 'main-panel-width-bottom',
        title: 'Main panel width at the bottom',
        description: 'Width of the front panel at floor level',
        tip: 'The main walk-in panel, measured at the tray.',
        illustrationId: 'panel-width-bottom',
        required: true,
      },
      {
        id: 'return-panel-width-bottom',
        title: 'Return panel width at the bottom',
        description: 'Width of the return at floor level',
        tip: 'The short panel turning back to the wall, measured at the tray.',
        illustrationId: 'return-width-bottom',
        required: true,
      },
      {
        id: 'main-panel-width-top',
        title: 'Main panel width at the top',
        description: 'Width of the front panel at glass height',
        tip: 'At finished height. Use smaller of top and bottom for main panel.',
        illustrationId: 'panel-width-top',
        required: true,
      },
      {
        id: 'return-panel-width-top',
        title: 'Return panel width at the top',
        description: 'Width of the return at glass height',
        tip: 'At finished height. Use smaller of top and bottom for return.',
        illustrationId: 'return-width-top',
        required: true,
      },
      {
        id: 'laser-anchor-wall',
        title: 'Anchor wall: laser line to wall',
        description: 'Check anchor wall plumb',
        tip: 'Wall the main panel attaches to. Laser line, measure gaps bottom to top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'laser-return-wall',
        title: 'Return wall: laser line to wall',
        description: 'Check return wall plumb',
        tip: 'Wall the return attaches to. Laser line, measure gaps bottom to top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top finish?',
        tip: 'Grout line, door frame, ceiling, or standard.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference',
        description: 'Tray to reference',
        tip: 'Straight up from tray.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or rail top',
        tip: 'From tray to head.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Spirit level',
        tip: 'Check both walls.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'Surface type',
        tip: 'Tray or wet room.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'corner-door-return': {
    id: 'corner-door-return',
    name: 'Corner enclosure (door + side)',
    description: 'Door on front with one side panel returning to wall',
    // NEEDS TRADE REVIEW: Corner enclosure measurement sequence. Do we measure:
    // 1) Back wall full width, then front opening width, then return depth?
    // 2) Or return depth (wall-to-wall), then front opening, then back?
    // 3) Does the fitter need the diagonal corner-to-corner, or just the three edges?
    steps: [
      {
        id: 'front-opening-width-bottom',
        title: 'Front opening width at the bottom',
        description: 'Door opening width at floor level',
        tip: 'Measure across the front at the tray where the door will go.',
        illustrationId: 'corner-front-bottom',
        required: true,
      },
      {
        id: 'return-depth-bottom',
        title: 'Side return depth at the bottom',
        description: 'Depth of the side panel at floor level',
        tip: 'From the back wall to the front edge of the return, at the tray.',
        illustrationId: 'corner-return-bottom',
        required: true,
      },
      {
        id: 'front-opening-width-top',
        title: 'Front opening width at the top',
        description: 'Door opening at glass height',
        tip: 'Across the front at finished height. Use smallest of top/bottom.',
        illustrationId: 'corner-front-top',
        required: true,
      },
      {
        id: 'return-depth-top',
        title: 'Side return depth at the top',
        description: 'Depth of return at glass height',
        tip: 'From back wall to front, at finished height. Use smallest.',
        illustrationId: 'corner-return-top',
        required: true,
      },
      {
        id: 'laser-back-wall',
        title: 'Back wall: laser line to wall',
        description: 'Check back wall plumb',
        tip: 'Vertical laser line on the back wall. Gaps bottom to top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'laser-side-wall',
        title: 'Side wall: laser line to wall',
        description: 'Check side wall plumb',
        tip: 'Vertical laser line on the side wall the return attaches to. Gaps bottom to top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top finish?',
        tip: 'Grout line, door frame, ceiling, or standard.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference',
        description: 'Tray to reference',
        tip: 'Straight up from tray.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or rail top',
        tip: 'From tray to head.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Spirit level',
        tip: 'Check back and side walls.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'Surface type',
        tip: 'Tray or wet room.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'over-bath': {
    id: 'over-bath',
    name: 'Over-bath screen',
    description: 'Shorter screen at one end of a bath',
    steps: [
      {
        id: 'screen-width-bottom',
        title: 'Screen width at the bottom',
        description: 'Width at the bath edge',
        tip: 'Measure along the bath edge where the screen will sit.',
        illustrationId: 'bath-width-bottom',
        required: true,
      },
      {
        id: 'screen-width-top',
        title: 'Screen width at the top',
        description: 'Width at the finished height',
        tip: 'At the height the screen will finish. Use smallest of top/bottom.',
        illustrationId: 'bath-width-top',
        required: true,
      },
      {
        id: 'laser-anchor-wall',
        title: 'Anchor wall: laser line to wall',
        description: 'Check anchor wall plumb',
        tip: 'Vertical laser line on the wall the screen attaches to. Gaps bottom to top.',
        illustrationId: 'laser-wall-vertical',
        required: false,
        laserOnly: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top finish?',
        tip: 'Usually a tile line. Bath screens are typically 1400–1500mm.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference',
        description: 'Bath edge to reference',
        tip: 'From the bath edge up to the reference.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or rail top',
        tip: 'From bath edge to head. Screen must clear it.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'plumb-check',
        title: 'Wall plumb check (optional)',
        description: 'Spirit level',
        tip: 'Check the anchor wall.',
        illustrationId: 'spirit-level',
        required: false,
        tapeOnly: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Window, radiator, taps.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },

  'custom': {
    id: 'custom',
    name: 'Custom configuration',
    description: 'Configured from scratch in the tool',
    // NEEDS TRADE REVIEW: For custom/freeform configurations built in the tool,
    // what's the correct general measurement sequence? Should we default to
    // the alcove plan and let them adjust, or provide a minimal generic plan?
    steps: [
      {
        id: 'opening-width-bottom',
        title: 'Opening width at the bottom',
        description: 'Widest dimension at floor level',
        tip: 'Main opening width at the tray or floor.',
        illustrationId: 'generic-width-bottom',
        required: true,
      },
      {
        id: 'opening-width-top',
        title: 'Opening width at the top',
        description: 'Widest dimension at glass height',
        tip: 'At finished height. Use smallest.',
        illustrationId: 'generic-width-top',
        required: true,
      },
      {
        id: 'height-reference',
        title: 'Height reference point',
        description: 'Where should the top finish?',
        tip: 'Grout line, door frame, ceiling, or standard.',
        illustrationId: 'height-reference',
        required: true,
      },
      {
        id: 'height-measurement',
        title: 'Height to reference',
        description: 'Tray to reference',
        tip: 'Straight up from tray.',
        illustrationId: 'height-vertical',
        required: true,
      },
      {
        id: 'shower-head-height',
        title: 'Shower head height',
        description: 'Outlet or rail top',
        tip: 'From tray to head.',
        illustrationId: 'shower-head',
        required: true,
      },
      {
        id: 'floor-type',
        title: 'Floor or tray type',
        description: 'Surface type',
        tip: 'Tray, wet room, or bath.',
        illustrationId: 'floor-type',
        required: true,
      },
      {
        id: 'obstacles',
        title: 'Obstacles',
        description: 'Anything in the way?',
        tip: 'Windows, radiators, sloped ceiling.',
        illustrationId: 'obstacles',
        required: false,
      },
    ],
  },
};

/**
 * Get the measurement plan for a given configuration.
 * Falls back to 'custom' if the specific plan is not found.
 */
export function getMeasurementPlan(configurationId: string): MeasurementPlan {
  return MEASUREMENT_PLANS[configurationId] ?? MEASUREMENT_PLANS['custom'];
}

/**
 * Filter steps based on measuring method (tape vs laser).
 */
export function getStepsForMethod(
  plan: MeasurementPlan,
  method: MeasuringMethod
): MeasurementStep[] {
  return plan.steps.filter((step) => {
    if (step.laserOnly && method !== 'laser') return false;
    if (step.tapeOnly && method !== 'tape') return false;
    return true;
  });
}

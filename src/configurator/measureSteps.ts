/**
 * Measurement step sequences per template.
 *
 * Each shower type requires specific measurements in a specific order. This
 * module defines those sequences for both tape and laser methods, ensuring
 * the customer is walked through exactly what they need to measure for their
 * chosen configuration.
 *
 * Design principles:
 * - Bottom width first (customer is at floor level)
 * - Height to chosen finish reference (grout line / door frame top / ceiling)
 * - Shower head check (soft warning if finish height too low, skip for bath screens)
 * - Top/middle widths for cross-check
 * - Wall measurements if method requires (laser: gaps show computed rake)
 * - Returns/side panels get their own steps
 * - Floor level measurements
 * - Bath screens skip shower-specific checks
 */

import type { ShowerTemplate } from './templates.js';
import { runPanelIndices, runLabelsFor } from './geometry.js';

export type MeasureStepType =
  | 'width-floor'
  | 'width-top'
  | 'width-middle'
  | 'height'
  | 'height-reference'
  | 'shower-head-check'
  | 'wall-start'
  | 'wall-end'
  | 'floor-level'
  | 'method-select'
  | 'confirm';

export interface MeasureStep {
  /** Unique identifier for this step */
  id: string;
  /** Type of measurement being taken */
  type: MeasureStepType;
  /** Which run this step applies to (0-indexed), or null for global steps */
  runIndex: number | null;
  /** Short title shown in progress indicator */
  title: string;
  /** 1-3 line instruction for this specific measurement */
  instruction: string;
  /** Which diagram to show (template-specific) */
  diagram: string;
  /** Whether this step is required or optional */
  required: boolean;
}

export interface MeasureSequence {
  /** Template this sequence is for */
  templateId: string;
  /** Steps for tape method */
  tapeSteps: MeasureStep[];
  /** Steps for laser method */
  laserSteps: MeasureStep[];
}

/**
 * Generate measurement steps for a given template and method.
 */
export function getMeasureSteps(
  template: ShowerTemplate,
  method: 'tape' | 'laser' | null
): MeasureStep[] {
  const runs = runPanelIndices(template.panels, template.junctions);
  const runLabels = runLabelsFor(template.panels, template.junctions);
  const isBathScreen = template.id === 'over-bath';

  const steps: MeasureStep[] = [];

  // Step 1: Method selection (if not chosen yet)
  if (!method) {
    steps.push({
      id: 'method',
      type: 'method-select',
      runIndex: null,
      title: 'Method',
      instruction: 'Choose how you will measure the walls.',
      diagram: 'method-options',
      required: true,
    });
    return steps;
  }

  // Step 2: Bottom width for each run (customer starts at floor level)
  runs.forEach((_, runIndex) => {
    const runLabel = runLabels[runIndex] || `Run ${runIndex + 1}`;
    steps.push({
      id: `run-${runIndex}-width-floor`,
      type: 'width-floor',
      runIndex,
      title: `${runLabel} width`,
      instruction: `Measure the width at floor level for the ${runLabel.toLowerCase()}.`,
      diagram: `${template.id}-run-${runIndex}-width-floor`,
      required: true,
    });
  });

  // Step 3: Height to chosen finish reference
  steps.push({
    id: 'height-reference',
    type: 'height-reference',
    runIndex: null,
    title: 'Finish height',
    instruction: 'Choose where the top of the glass will finish: grout line, door frame top, or ceiling.',
    diagram: `${template.id}-height-reference`,
    required: true,
  });

  steps.push({
    id: 'height',
    type: 'height',
    runIndex: null,
    title: 'Height',
    instruction: isBathScreen
      ? 'Measure from the top of the bath to the finish reference you chose.'
      : 'Measure from the shower tray (or floor) to the finish reference you chose.',
    diagram: `${template.id}-height`,
    required: true,
  });

  // Step 4: Shower head check (soft warning, skip for bath screens)
  if (!isBathScreen) {
    steps.push({
      id: 'shower-head-check',
      type: 'shower-head-check',
      runIndex: null,
      title: 'Shower head',
      instruction: 'Check that the finish height is suitable above the shower head.',
      diagram: `${template.id}-shower-head`,
      required: false,
    });
  }

  // Step 5: Top/middle widths for cross-check
  runs.forEach((_, runIndex) => {
    const runLabel = runLabels[runIndex] || `Run ${runIndex + 1}`;

    // Top width (optional cross-check for tape, not shown for laser - derived from wall gaps)
    if (method === 'tape') {
      steps.push({
        id: `run-${runIndex}-width-top`,
        type: 'width-top',
        runIndex,
        title: `${runLabel} top`,
        instruction: `Optional: measure the width at the top to check if the walls lean.`,
        diagram: `${template.id}-run-${runIndex}-width-top`,
        required: false,
      });

      steps.push({
        id: `run-${runIndex}-width-middle`,
        type: 'width-middle',
        runIndex,
        title: `${runLabel} middle`,
        instruction: `Optional: measure the width at mid-height to detect bowing.`,
        diagram: `${template.id}-run-${runIndex}-width-middle`,
        required: false,
      });
    }
  });

  // Step 6: Wall measurements (laser method: gaps show computed rake)
  if (method === 'laser') {
    if (template.leftWall) {
      steps.push({
        id: 'wall-start',
        type: 'wall-start',
        runIndex: null,
        title: 'Start wall',
        instruction: 'Set vertical laser line. Measure gap from line to wall at bottom and top. Middle optional.',
        diagram: `${template.id}-wall-start`,
        required: true,
      });
    }

    if (template.rightWall) {
      steps.push({
        id: 'wall-end',
        type: 'wall-end',
        runIndex: null,
        title: 'End wall',
        instruction: 'Measure gap from laser line to wall at bottom and top. We compute rake from these.',
        diagram: `${template.id}-wall-end`,
        required: true,
      });
    }
  }

  // Floor level for each run (skip for bath screens - bath is level)
  if (!isBathScreen) {
    runs.forEach((_, runIndex) => {
      const runLabel = runLabels[runIndex] || `Run ${runIndex + 1}`;
      steps.push({
        id: `run-${runIndex}-floor`,
        type: 'floor-level',
        runIndex,
        title: `${runLabel} floor`,
        instruction: `Measure the floor fall for the ${runLabel.toLowerCase()}.`,
        diagram: `${template.id}-run-${runIndex}-floor`,
        required: true,
      });
    });
  }

  // Final confirmation
  steps.push({
    id: 'confirm',
    type: 'confirm',
    runIndex: null,
    title: 'Confirm',
    instruction: 'Check the drawing matches your opening.',
    diagram: `${template.id}-preview`,
    required: true,
  });

  return steps;
}

/**
 * Get the total number of steps for a template and method.
 */
export function getStepCount(template: ShowerTemplate, method: 'tape' | 'laser' | null): number {
  return getMeasureSteps(template, method).length;
}

/**
 * Get the current step index (0-based) for the wizard.
 */
export function getCurrentStepIndex(
  template: ShowerTemplate,
  method: 'tape' | 'laser' | null,
  stepId: string | null
): number {
  const steps = getMeasureSteps(template, method);
  if (!stepId) return 0;
  const index = steps.findIndex((s) => s.id === stepId);
  return index === -1 ? 0 : index;
}

/**
 * Validate that all required measurements are present before allowing progression.
 */
export function canProgressToNextStep(
  step: MeasureStep,
  measurementState: unknown
): boolean {
  // TODO: Implement validation based on step type and measurement state
  // This will check if the required fields for this step are filled in
  return true;
}

/**
 * Pre-generate all sequences for validation and testing.
 */
export function getAllSequences(templates: ShowerTemplate[]): MeasureSequence[] {
  return templates.map((template) => ({
    templateId: template.id,
    tapeSteps: getMeasureSteps(template, 'tape'),
    laserSteps: getMeasureSteps(template, 'laser'),
  }));
}

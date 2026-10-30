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
 * - Height second (finish height matters for glass spec)
 * - Wall measurements if method requires (tape vs laser)
 * - Returns/side panels get their own steps
 * - Bath screens skip shower-tray-specific checks
 */

import type { ShowerTemplate } from './templates.js';
import { runPanelIndices, runLabelsFor } from './geometry.js';

export type MeasureStepType =
  | 'width-floor'
  | 'width-top'
  | 'height'
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

  // Step 2: Height (finish height for glass spec)
  steps.push({
    id: 'height',
    type: 'height',
    runIndex: null,
    title: 'Height',
    instruction: isBathScreen
      ? 'Measure from the top of the bath to where the glass will finish.'
      : 'Measure from the shower tray (or floor) to where the glass will finish.',
    diagram: `${template.id}-height`,
    required: true,
  });

  // Steps 3+: Width measurements for each run
  runs.forEach((_, runIndex) => {
    const runLabel = runLabels[runIndex] || `Run ${runIndex + 1}`;

    // Bottom width (always required)
    steps.push({
      id: `run-${runIndex}-width-floor`,
      type: 'width-floor',
      runIndex,
      title: `${runLabel} width`,
      instruction: `Measure the width at floor level for the ${runLabel.toLowerCase()}.`,
      diagram: `${template.id}-run-${runIndex}-width-floor`,
      required: true,
    });

    // Top width (optional cross-check for tape, not shown for laser)
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
    }
  });

  // Wall measurements (laser method requires gaps, tape may skip)
  if (method === 'laser' && template.leftWall) {
    steps.push({
      id: 'wall-start',
      type: 'wall-start',
      runIndex: null,
      title: 'Start wall',
      instruction: 'Measure gaps from the laser line to the start wall at bottom and top.',
      diagram: `${template.id}-wall-start`,
      required: true,
    });
  }

  if (method === 'laser' && template.rightWall) {
    steps.push({
      id: 'wall-end',
      type: 'wall-end',
      runIndex: null,
      title: 'End wall',
      instruction: 'Measure gaps from the laser line to the end wall at bottom and top.',
      diagram: `${template.id}-wall-end`,
      required: true,
    });
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

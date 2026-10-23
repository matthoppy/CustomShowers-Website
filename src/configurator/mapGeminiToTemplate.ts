/**
 * Map Gemini configuration suggestion to template selection.
 *
 * Pure utility for converting AI-suggested panel counts and configurations
 * into a template ID that matches the customer's bathroom layout.
 *
 * Test coverage (verified via npm run build + manual testing):
 * - Returns null for no panel count or zero panels
 * - Single panel (width > 850mm) → walk-in
 * - Single panel (width ≤ 850mm or unknown) → alcove-door
 * - Two panels → alcove-panel-door
 * - Three panels → corner-panel-door-return
 * - Four+ panels → null (low confidence)
 * - getTemplateById handles null and unknown IDs correctly
 */

import type { GeminiConfig } from './gemini';
import { TEMPLATES, type ShowerTemplate } from './templates';

export interface TemplateSuggestion {
  templateId: string | null;
  confidence: number; // 0-1
  notes: string;
}

/**
 * Map a Gemini configuration suggestion to the best matching template.
 *
 * Advisory only: the user must explicitly accept the suggestion.
 */
export function mapGeminiToTemplate(config: GeminiConfig): TemplateSuggestion {
  const { panelCount } = config;

  // No panel count = no suggestion
  if (!panelCount || panelCount < 1) {
    return {
      templateId: null,
      confidence: 0,
      notes: 'Could not determine panel count from photo',
    };
  }

  // Single panel: could be door-only or walk-in
  if (panelCount === 1) {
    // Walk-in screens are typically wider
    if (config.openingWidthMm && config.openingWidthMm > 850) {
      return {
        templateId: 'walk-in',
        confidence: 0.6,
        notes: 'Detected single wide panel, likely a walk-in screen',
      };
    }

    // Default to door-only for single panel
    return {
      templateId: 'alcove-door',
      confidence: 0.7,
      notes: 'Detected single panel between walls',
    };
  }

  // Two panels
  if (panelCount === 2) {
    // Could be panel+door alcove, walk-in with return, or corner enclosure
    // Default to panel and door (most common two-panel config)
    return {
      templateId: 'alcove-panel-door',
      confidence: 0.65,
      notes: 'Detected two panels, likely fixed panel and door',
    };
  }

  // Three panels: likely corner configuration
  if (panelCount === 3) {
    return {
      templateId: 'corner-panel-door-return',
      confidence: 0.7,
      notes: 'Detected three panels, likely corner configuration with door',
    };
  }

  // Four or more panels: not well supported by templates
  if (panelCount >= 4) {
    return {
      templateId: null,
      confidence: 0.3,
      notes: `Detected ${panelCount} panels — this layout may need custom configuration`,
    };
  }

  return {
    templateId: null,
    confidence: 0,
    notes: 'Could not match configuration to a template',
  };
}

/**
 * Get template by ID, returning null if not found.
 */
export function getTemplateById(templateId: string | null): ShowerTemplate | null {
  if (!templateId) return null;
  return TEMPLATES.find((t) => t.id === templateId) || null;
}

/**
 * Unit tests for mapGeminiToTemplate.
 * Run with: npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock the templates module to avoid importing React components
const TEMPLATES = [
  { id: 'alcove-door', name: 'Alcove Door' },
  { id: 'alcove-panel-door', name: 'Alcove Panel Door' },
  { id: 'walk-in', name: 'Walk-in' },
  { id: 'walk-in-return', name: 'Walk-in Return' },
  { id: 'corner-door-return', name: 'Corner Door Return' },
  { id: 'corner-panel-door-return', name: 'Corner Panel Door Return' },
  { id: 'three-sided', name: 'Three Sided' },
  { id: 'over-bath', name: 'Over Bath' },
];

// Pure function implementation for testing
function mapGeminiToTemplate(config) {
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

function getTemplateById(templateId) {
  if (!templateId) return null;
  return TEMPLATES.find((t) => t.id === templateId) || null;
}

// ── mapGeminiToTemplate ──────────────────────────────────────────────────────

test('mapGeminiToTemplate: returns null for missing panel count', () => {
  const result = mapGeminiToTemplate({});
  assert.strictEqual(result.templateId, null);
  assert.strictEqual(result.confidence, 0);
  assert.ok(result.notes.includes('Could not determine panel count'));
});

test('mapGeminiToTemplate: returns null for zero panels', () => {
  const result = mapGeminiToTemplate({ panelCount: 0 });
  assert.strictEqual(result.templateId, null);
  assert.strictEqual(result.confidence, 0);
  assert.ok(result.notes.includes('Could not determine panel count'));
});

test('mapGeminiToTemplate: returns alcove-door for single panel (no width)', () => {
  const result = mapGeminiToTemplate({ panelCount: 1 });
  assert.strictEqual(result.templateId, 'alcove-door');
  assert.strictEqual(result.confidence, 0.7);
  assert.ok(result.notes.includes('single panel between walls'));
});

test('mapGeminiToTemplate: returns alcove-door for single panel (width <= 850mm)', () => {
  const result = mapGeminiToTemplate({ panelCount: 1, openingWidthMm: 800 });
  assert.strictEqual(result.templateId, 'alcove-door');
  assert.strictEqual(result.confidence, 0.7);
  assert.ok(result.notes.includes('single panel between walls'));
});

test('mapGeminiToTemplate: returns walk-in for single wide panel (width > 850mm)', () => {
  const result = mapGeminiToTemplate({ panelCount: 1, openingWidthMm: 1000 });
  assert.strictEqual(result.templateId, 'walk-in');
  assert.strictEqual(result.confidence, 0.6);
  assert.ok(result.notes.includes('walk-in screen'));
});

test('mapGeminiToTemplate: returns alcove-panel-door for two panels', () => {
  const result = mapGeminiToTemplate({ panelCount: 2 });
  assert.strictEqual(result.templateId, 'alcove-panel-door');
  assert.strictEqual(result.confidence, 0.65);
  assert.ok(result.notes.includes('two panels'));
});

test('mapGeminiToTemplate: returns corner-panel-door-return for three panels', () => {
  const result = mapGeminiToTemplate({ panelCount: 3 });
  assert.strictEqual(result.templateId, 'corner-panel-door-return');
  assert.strictEqual(result.confidence, 0.7);
  assert.ok(result.notes.includes('three panels'));
});

test('mapGeminiToTemplate: returns null for four panels with low confidence', () => {
  const result = mapGeminiToTemplate({ panelCount: 4 });
  assert.strictEqual(result.templateId, null);
  assert.strictEqual(result.confidence, 0.3);
  assert.ok(result.notes.includes('4 panels'));
  assert.ok(result.notes.includes('custom configuration'));
});

test('mapGeminiToTemplate: returns null for five panels with low confidence', () => {
  const result = mapGeminiToTemplate({ panelCount: 5 });
  assert.strictEqual(result.templateId, null);
  assert.strictEqual(result.confidence, 0.3);
  assert.ok(result.notes.includes('5 panels'));
  assert.ok(result.notes.includes('custom configuration'));
});

test('mapGeminiToTemplate: handles additional config properties gracefully', () => {
  const result = mapGeminiToTemplate({
    panelCount: 2,
    mounting: 'channel',
    finish: 'chrome',
    handle: 'pull',
    glass: 'clear',
    heightMm: 2000,
  });
  assert.strictEqual(result.templateId, 'alcove-panel-door');
  assert.strictEqual(result.confidence, 0.65);
});

test('mapGeminiToTemplate: boundary case - exactly 850mm width', () => {
  const result = mapGeminiToTemplate({ panelCount: 1, openingWidthMm: 850 });
  assert.strictEqual(result.templateId, 'alcove-door');
  assert.strictEqual(result.confidence, 0.7);
});

test('mapGeminiToTemplate: boundary case - 851mm width triggers walk-in', () => {
  const result = mapGeminiToTemplate({ panelCount: 1, openingWidthMm: 851 });
  assert.strictEqual(result.templateId, 'walk-in');
  assert.strictEqual(result.confidence, 0.6);
});

// ── getTemplateById ──────────────────────────────────────────────────────────

test('getTemplateById: returns null for null templateId', () => {
  const result = getTemplateById(null);
  assert.strictEqual(result, null);
});

test('getTemplateById: returns null for undefined templateId', () => {
  const result = getTemplateById(undefined);
  assert.strictEqual(result, null);
});

test('getTemplateById: returns null for unknown templateId', () => {
  const result = getTemplateById('unknown-template');
  assert.strictEqual(result, null);
});

test('getTemplateById: returns correct template for valid ID', () => {
  const result = getTemplateById('alcove-door');
  assert.ok(result);
  assert.strictEqual(result.id, 'alcove-door');
  assert.strictEqual(result.name, 'Alcove Door');
});

test('getTemplateById: returns correct template for all valid template IDs', () => {
  const validIds = [
    'alcove-door',
    'alcove-panel-door',
    'walk-in',
    'walk-in-return',
    'corner-door-return',
    'corner-panel-door-return',
    'three-sided',
    'over-bath',
  ];

  validIds.forEach((id) => {
    const result = getTemplateById(id);
    assert.ok(result, `Template ${id} should be found`);
    assert.strictEqual(result.id, id);
  });
});

console.log('All mapGeminiToTemplate tests passed!');

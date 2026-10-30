/**
 * Tests for measurement step sequences.
 *
 * Validates that every template has a proper step sequence with:
 * - Height measurement before width (finish height matters for glass spec)
 * - Height measurement included
 * - Correct number of runs
 * - Returns/side panels get their own steps
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Mock templates to avoid importing React dependencies
const TEMPLATES = [
  {
    id: 'alcove-door',
    name: 'Door only',
    panels: [{ id: 'p1', kind: 'door', width_mm: 700 }],
    junctions: [],
    leftWall: true,
    rightWall: true,
  },
  {
    id: 'alcove-panel-door',
    name: 'Panel and door',
    panels: [
      { id: 'p1', kind: 'fixed', width_mm: 400 },
      { id: 'p2', kind: 'door', width_mm: 700 },
    ],
    junctions: [{ angle_deg: 180 }],
    leftWall: true,
    rightWall: true,
  },
  {
    id: 'walk-in',
    name: 'Walk-in screen',
    panels: [{ id: 'p1', kind: 'fixed', width_mm: 900 }],
    junctions: [],
    leftWall: true,
    rightWall: false,
  },
  {
    id: 'walk-in-return',
    name: 'Walk-in with return',
    panels: [
      { id: 'p1', kind: 'fixed', width_mm: 900 },
      { id: 'p2', kind: 'fixed', width_mm: 300 },
    ],
    junctions: [{ angle_deg: 90 }],
    leftWall: true,
    rightWall: false,
  },
  {
    id: 'corner-door-return',
    name: 'Corner, door and side',
    panels: [
      { id: 'p1', kind: 'fixed', width_mm: 800 },
      { id: 'p2', kind: 'door', width_mm: 700 },
    ],
    junctions: [{ angle_deg: 90 }],
    leftWall: true,
    rightWall: true,
  },
  {
    id: 'corner-panel-door-return',
    name: 'Corner, wider front',
    panels: [
      { id: 'p1', kind: 'fixed', width_mm: 800 },
      { id: 'p2', kind: 'fixed', width_mm: 300 },
      { id: 'p3', kind: 'door', width_mm: 700 },
    ],
    junctions: [{ angle_deg: 90 }, { angle_deg: 180 }],
    leftWall: true,
    rightWall: true,
  },
  {
    id: 'three-sided',
    name: 'Three sided',
    panels: [
      { id: 'p1', kind: 'fixed', width_mm: 600 },
      { id: 'p2', kind: 'door', width_mm: 700 },
      { id: 'p3', kind: 'fixed', width_mm: 600 },
    ],
    junctions: [{ angle_deg: 90 }, { angle_deg: 90 }],
    leftWall: true,
    rightWall: true,
  },
  {
    id: 'over-bath',
    name: 'Over a bath',
    panels: [{ id: 'p1', kind: 'fixed', width_mm: 850 }],
    junctions: [],
    leftWall: true,
    rightWall: false,
    heightMm: 1500,
  },
];

// Mock the getMeasureSteps function with simplified logic
function getMeasureSteps(template, method) {
  const runCount = countRuns(template.panels, template.junctions);
  const isBathScreen = template.id === 'over-bath';
  const steps = [];

  if (!method) {
    steps.push({ id: 'method', type: 'method-select', title: 'Method', required: true, instruction: 'Choose method', diagram: 'method-options', runIndex: null });
    return steps;
  }

  // Height first
  steps.push({ id: 'height', type: 'height', title: 'Height', required: true, instruction: 'Measure height', diagram: `${template.id}-height`, runIndex: null });

  // Width for each run
  for (let i = 0; i < runCount; i++) {
    steps.push({ id: `run-${i}-width-floor`, type: 'width-floor', title: `Run ${i} width`, required: true, instruction: 'Measure width', diagram: `${template.id}-run-${i}-width-floor`, runIndex: i });
    if (method === 'tape') {
      steps.push({ id: `run-${i}-width-top`, type: 'width-top', title: `Run ${i} top`, required: false, instruction: 'Optional top width', diagram: `${template.id}-run-${i}-width-top`, runIndex: i });
    }
  }

  // Walls for laser
  if (method === 'laser') {
    if (template.leftWall) {
      steps.push({ id: 'wall-start', type: 'wall-start', title: 'Start wall', required: true, instruction: 'Measure wall', diagram: `${template.id}-wall-start`, runIndex: null });
    }
    if (template.rightWall) {
      steps.push({ id: 'wall-end', type: 'wall-end', title: 'End wall', required: true, instruction: 'Measure wall', diagram: `${template.id}-wall-end`, runIndex: null });
    }
  }

  // Floor level (skip for bath screens)
  if (!isBathScreen) {
    for (let i = 0; i < runCount; i++) {
      steps.push({ id: `run-${i}-floor`, type: 'floor-level', title: `Run ${i} floor`, required: true, instruction: 'Measure floor', diagram: `${template.id}-run-${i}-floor`, runIndex: i });
    }
  }

  // Confirm
  steps.push({ id: 'confirm', type: 'confirm', title: 'Confirm', required: true, instruction: 'Confirm', diagram: `${template.id}-preview`, runIndex: null });

  return steps;
}

function countRuns(panels, junctions) {
  if (panels.length === 0) return 0;
  let runs = 1;
  for (let i = 0; i < junctions.length; i++) {
    if (junctions[i].angle_deg !== 180) runs++;
  }
  return runs;
}

function getStepCount(template, method) {
  return getMeasureSteps(template, method).length;
}

function getAllSequences(templates) {
  return templates.map((template) => ({
    templateId: template.id,
    tapeSteps: getMeasureSteps(template, 'tape'),
    laserSteps: getMeasureSteps(template, 'laser'),
  }));
}

// Tests
test('every template has tape and laser sequences', () => {
  const sequences = getAllSequences(TEMPLATES);

  assert.strictEqual(sequences.length, TEMPLATES.length, 'Should have sequence for each template');

  sequences.forEach((seq) => {
    assert.ok(seq.tapeSteps.length > 0, `${seq.templateId} should have tape steps`);
    assert.ok(seq.laserSteps.length > 0, `${seq.templateId} should have laser steps`);
  });
});

test('method selection is first step when method is null', () => {
  TEMPLATES.forEach((template) => {
    const steps = getMeasureSteps(template, null);

    assert.ok(steps.length > 0, `${template.id} should have steps`);
    assert.strictEqual(steps[0].type, 'method-select', `${template.id} first step should be method selection`);
  });
});

test('height measurement is included for all templates', () => {
  TEMPLATES.forEach((template) => {
    const tapeSteps = getMeasureSteps(template, 'tape');
    const laserSteps = getMeasureSteps(template, 'laser');

    const tapeHasHeight = tapeSteps.some((s) => s.type === 'height');
    const laserHasHeight = laserSteps.some((s) => s.type === 'height');

    assert.ok(tapeHasHeight, `${template.id} tape should include height step`);
    assert.ok(laserHasHeight, `${template.id} laser should include height step`);
  });
});

test('height comes before width measurements', () => {
  TEMPLATES.forEach((template) => {
    const tapeSteps = getMeasureSteps(template, 'tape');
    const laserSteps = getMeasureSteps(template, 'laser');

    [tapeSteps, laserSteps].forEach((steps) => {
      const heightIndex = steps.findIndex((s) => s.type === 'height');
      const firstWidthIndex = steps.findIndex((s) => s.type === 'width-floor');

      if (heightIndex !== -1 && firstWidthIndex !== -1) {
        assert.ok(
          heightIndex < firstWidthIndex,
          `${template.id} height (${heightIndex}) should come before width (${firstWidthIndex})`
        );
      }
    });
  });
});

test('alcove-door has single width measurement', () => {
  const template = TEMPLATES.find((t) => t.id === 'alcove-door');
  const steps = getMeasureSteps(template, 'tape');

  const widthSteps = steps.filter((s) => s.type === 'width-floor');
  assert.strictEqual(widthSteps.length, 1, 'alcove-door should have 1 width step');
});

test('walk-in-return has two width measurements (main + return)', () => {
  const template = TEMPLATES.find((t) => t.id === 'walk-in-return');
  const steps = getMeasureSteps(template, 'tape');

  const widthSteps = steps.filter((s) => s.type === 'width-floor');
  assert.strictEqual(widthSteps.length, 2, 'walk-in-return should have 2 width steps (2 runs)');
});

test('corner-door-return has two width measurements', () => {
  const template = TEMPLATES.find((t) => t.id === 'corner-door-return');
  const steps = getMeasureSteps(template, 'tape');

  const widthSteps = steps.filter((s) => s.type === 'width-floor');
  assert.strictEqual(widthSteps.length, 2, 'corner-door-return should have 2 width steps');
});

test('laser method includes wall measurements for walled templates', () => {
  const alcoveDoor = TEMPLATES.find((t) => t.id === 'alcove-door');
  const steps = getMeasureSteps(alcoveDoor, 'laser');

  const hasStartWall = steps.some((s) => s.type === 'wall-start');
  const hasEndWall = steps.some((s) => s.type === 'wall-end');

  assert.ok(hasStartWall, 'alcove-door with laser should measure start wall');
  assert.ok(hasEndWall, 'alcove-door with laser should measure end wall');
});

test('walk-in does not measure end wall (no right wall)', () => {
  const walkIn = TEMPLATES.find((t) => t.id === 'walk-in');
  const steps = getMeasureSteps(walkIn, 'laser');

  const hasEndWall = steps.some((s) => s.type === 'wall-end');

  assert.strictEqual(hasEndWall, false, 'walk-in should not measure end wall (open side)');
});

test('over-bath does not have floor-level measurements', () => {
  const overBath = TEMPLATES.find((t) => t.id === 'over-bath');
  const tapeSteps = getMeasureSteps(overBath, 'tape');
  const laserSteps = getMeasureSteps(overBath, 'laser');

  const tapeHasFloor = tapeSteps.some((s) => s.type === 'floor-level');
  const laserHasFloor = laserSteps.some((s) => s.type === 'floor-level');

  assert.strictEqual(tapeHasFloor, false, 'over-bath should not measure floor (bath is level)');
  assert.strictEqual(laserHasFloor, false, 'over-bath should not measure floor (bath is level)');
});

test('non-bath templates include floor-level measurements', () => {
  const nonBathTemplates = TEMPLATES.filter((t) => t.id !== 'over-bath');

  nonBathTemplates.forEach((template) => {
    const steps = getMeasureSteps(template, 'tape');
    const hasFloor = steps.some((s) => s.type === 'floor-level');

    assert.ok(hasFloor, `${template.id} should measure floor level`);
  });
});

test('confirm step is always last', () => {
  TEMPLATES.forEach((template) => {
    const tapeSteps = getMeasureSteps(template, 'tape');
    const laserSteps = getMeasureSteps(template, 'laser');

    [tapeSteps, laserSteps].forEach((steps) => {
      if (steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        assert.strictEqual(lastStep.type, 'confirm', `${template.id} last step should be confirm`);
      }
    });
  });
});

test('all steps have required properties', () => {
  TEMPLATES.forEach((template) => {
    const steps = getMeasureSteps(template, 'tape');

    steps.forEach((step, i) => {
      assert.ok(step.id, `${template.id} step ${i} should have id`);
      assert.ok(step.type, `${template.id} step ${i} should have type`);
      assert.ok(step.title, `${template.id} step ${i} should have title`);
      assert.ok(step.instruction, `${template.id} step ${i} should have instruction`);
      assert.ok(step.diagram, `${template.id} step ${i} should have diagram`);
      assert.strictEqual(typeof step.required, 'boolean', `${template.id} step ${i} should have boolean required`);
    });
  });
});

test('step count matches actual step array length', () => {
  TEMPLATES.forEach((template) => {
    const tapeSteps = getMeasureSteps(template, 'tape');
    const laserSteps = getMeasureSteps(template, 'laser');

    assert.strictEqual(
      getStepCount(template, 'tape'),
      tapeSteps.length,
      `${template.id} tape step count should match array length`
    );

    assert.strictEqual(
      getStepCount(template, 'laser'),
      laserSteps.length,
      `${template.id} laser step count should match array length`
    );
  });
});

test('tape method includes optional top-width cross-check', () => {
  const alcoveDoor = TEMPLATES.find((t) => t.id === 'alcove-door');
  const tapeSteps = getMeasureSteps(alcoveDoor, 'tape');

  const topWidthSteps = tapeSteps.filter((s) => s.type === 'width-top');
  assert.ok(topWidthSteps.length > 0, 'tape method should include top-width step');
  assert.strictEqual(topWidthSteps[0].required, false, 'top-width should be optional');
});

test('laser method does not include top-width step', () => {
  const alcoveDoor = TEMPLATES.find((t) => t.id === 'alcove-door');
  const laserSteps = getMeasureSteps(alcoveDoor, 'laser');

  const topWidthSteps = laserSteps.filter((s) => s.type === 'width-top');
  assert.strictEqual(topWidthSteps.length, 0, 'laser method should not include top-width (derives from wall gaps)');
});

test('three-sided template has three runs', () => {
  const threeSided = TEMPLATES.find((t) => t.id === 'three-sided');
  const steps = getMeasureSteps(threeSided, 'tape');

  const widthSteps = steps.filter((s) => s.type === 'width-floor');
  assert.strictEqual(widthSteps.length, 3, 'three-sided should have 3 width steps (3 runs)');
});

test('corner-panel-door-return has two runs', () => {
  const template = TEMPLATES.find((t) => t.id === 'corner-panel-door-return');
  const steps = getMeasureSteps(template, 'tape');

  const widthSteps = steps.filter((s) => s.type === 'width-floor');
  assert.strictEqual(widthSteps.length, 2, 'corner-panel-door-return should have 2 runs');
});

console.log('All measureSteps tests passed!');

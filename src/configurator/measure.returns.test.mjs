/**
 * Short returns. A run of fixed glass alone can be a return panel only a few
 * hundred millimetres wide, so the wrong-units check holds it to 100mm rather
 * than the 400mm a run with a door in it needs. Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { TEMPLATES } from './templates.ts';
import { openingContext, runPanelIndices, runWidthsMm } from './geometry.ts';
import { scaleRunPanels } from './layout.ts';
import {
  checkMeasurements,
  createOpeningMeasurements,
  measurementsUsable,
  MIN_PLAUSIBLE_MM,
  MIN_PLAUSIBLE_RETURN_MM,
} from './measure.ts';

const byId = (id) => TEMPLATES.find((t) => t.id === id);

/**
 * A design as the designer holds it straight after a template is picked: the
 * template's own widths, nothing measured, and the walls not checked.
 */
function design(templateId) {
  const t = byId(templateId);
  const panels = structuredClone(t.panels);
  const junctions = structuredClone(t.junctions);
  const opening = createOpeningMeasurements(runWidthsMm(panels, junctions));
  opening.method = 'assumed-square';
  return {
    panels,
    junctions,
    leftWall: t.leftWall,
    rightWall: t.rightWall,
    heightMm: t.heightMm ?? 2000,
    isFloorToCeiling: false,
    opening,
  };
}

/** Type a floor width into one run, the way the width screen does. */
function withWidth(s, runIndex, widthMm) {
  const indices = runPanelIndices(s.panels, s.junctions)[runIndex];
  return {
    ...s,
    panels: scaleRunPanels(s.panels, indices, widthMm),
    opening: {
      ...s.opening,
      runs: s.opening.runs.map((r, i) => (i === runIndex ? { ...r, widthAtFloorMm: widthMm } : r)),
    },
  };
}

const checksFor = (s) => checkMeasurements(s.opening, openingContext(s));
/** What stops the customer, other than not having confirmed the drawing yet. */
const stoppers = (s) =>
  checksFor(s).filter((c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed');
const stopperCodes = (s) => stoppers(s).map((c) => c.code);

test('a run is held to 400mm with a door in it and to 100mm without one', () => {
  assert.strictEqual(MIN_PLAUSIBLE_MM, 400);
  assert.strictEqual(MIN_PLAUSIBLE_RETURN_MM, 100);
  const mins = Object.fromEntries(
    TEMPLATES.map((t) => [t.id, openingContext(design(t.id)).minWidthsMm])
  );
  assert.deepStrictEqual(mins, {
    'alcove-door': [400],
    'alcove-panel-door': [400],
    'walk-in': [100],
    'walk-in-return': [100, 100],
    // Both corner templates list the side first, so run 0 is the side.
    'corner-door-return': [100, 400],
    'corner-panel-door-return': [100, 400],
    'three-sided': [100, 400, 100],
    'over-bath': [100],
  });
});

for (const t of TEMPLATES) {
  test(`"${t.name}" is not stopped at the sizes it starts with`, () => {
    const s = design(t.id);
    assert.deepStrictEqual(stopperCodes(s), []);
    // Confirming the drawing is then all that is left before the next step.
    s.opening.shapeConfirmed = true;
    assert.ok(measurementsUsable(checksFor(s)), 'the measuring summary can be left');
  });
}

test('a walk-in return of 150, 200, 300 and 399mm is accepted', () => {
  for (const mm of [150, 200, 300, 399]) {
    assert.deepStrictEqual(stopperCodes(withWidth(design('walk-in-return'), 1, mm)), [], `${mm}mm return`);
  }
});

test('a return typed as 30 is still caught as centimetres, and 300 is offered', () => {
  const found = stoppers(withWidth(design('walk-in-return'), 1, 30));
  assert.deepStrictEqual(found.map((c) => c.code), ['run1-widthAtFloor-unit-centimetres']);
  assert.strictEqual(found[0].runIndex, 1);
  assert.strictEqual(found[0].suggestionMm, 300);
  assert.strictEqual(
    found[0].message,
    '30 looks like centimetres. Did you mean 300mm for the right return width at the floor?'
  );
});

test('a return still has a floor of its own: 100mm passes, and less is caught', () => {
  const at = (mm) => stoppers(withWidth(design('walk-in-return'), 1, mm));
  assert.deepStrictEqual(at(100), []);

  const [cm] = at(99);
  assert.strictEqual(cm.code, 'run1-widthAtFloor-unit-centimetres');
  assert.strictEqual(cm.suggestionMm, 990);

  const [metres] = at(0.3);
  assert.strictEqual(metres.code, 'run1-widthAtFloor-unit-metres');
  assert.strictEqual(metres.suggestionMm, 300);

  // Too small to be a slip in either unit, so it is simply refused.
  assert.deepStrictEqual(at(5).map((c) => c.code), ['run1-widthAtFloor-implausible']);
  // The upper limit is the same for every run.
  assert.deepStrictEqual(at(3000), []);
  assert.deepStrictEqual(at(3001).map((c) => c.code), ['run1-widthAtFloor-implausible']);
});

test('a run with a door in it is still held to 400mm', () => {
  // "Corner, door and side" lists the side first: run 0 is the side panel and
  // run 1 is the front, with the door in it.
  const front = (mm) => stoppers(withWidth(design('corner-door-return'), 1, mm));
  const refused = front(300);
  assert.deepStrictEqual(refused.map((c) => c.code), ['run1-widthAtFloor-unit-centimetres']);
  assert.strictEqual(refused[0].suggestionMm, 3000);
  assert.strictEqual(
    refused[0].message,
    '300 looks like centimetres. Did you mean 3000mm for the front width at the floor?'
  );
  assert.deepStrictEqual(front(399).map((c) => c.code), ['run1-widthAtFloor-implausible']);
  assert.deepStrictEqual(front(400), []);

  // The side is fixed glass alone, so the same 300mm is a real panel there.
  assert.deepStrictEqual(stopperCodes(withWidth(design('corner-door-return'), 0, 300)), []);
});

test('a fixed panel beside the door does not lower the floor for that run', () => {
  // "Corner, wider front": the front is a fixed panel and the door together.
  assert.deepStrictEqual(
    stopperCodes(withWidth(design('corner-panel-door-return'), 1, 300)),
    ['run1-widthAtFloor-unit-centimetres']
  );
  // "Three sided": both sides are fixed glass, the front is the door.
  const threeSided = design('three-sided');
  assert.deepStrictEqual(stopperCodes(withWidth(withWidth(threeSided, 0, 300), 2, 250)), []);
  assert.deepStrictEqual(stopperCodes(withWidth(threeSided, 1, 300)), ['run1-widthAtFloor-unit-centimetres']);
});

test('a single opening between two walls is unchanged: 90 and 300 are both caught', () => {
  for (const id of ['alcove-door', 'alcove-panel-door']) {
    const ninety = stoppers(withWidth(design(id), 0, 90));
    assert.deepStrictEqual(ninety.map((c) => c.code), ['run0-widthAtFloor-unit-centimetres'], id);
    assert.strictEqual(ninety[0].suggestionMm, 900, id);
    assert.strictEqual(ninety[0].message, '90 looks like centimetres. Did you mean 900mm for the width at the floor?', id);

    const threeHundred = stoppers(withWidth(design(id), 0, 300));
    assert.deepStrictEqual(threeHundred.map((c) => c.code), ['run0-widthAtFloor-unit-centimetres'], id);
    assert.strictEqual(threeHundred[0].suggestionMm, 3000, id);
  }
});

test('without minWidthsMm every run is held to 400mm, exactly as before', () => {
  // The engine on its own, called by something that knows nothing of the shape.
  const bare = { hasStartWall: true, hasEndWall: false, glassHeightMm: 2000 };
  const at = (mm, ctx = bare) => {
    const m = createOpeningMeasurements([900, mm]);
    m.method = 'assumed-square';
    m.shapeConfirmed = true;
    return checkMeasurements(m, ctx);
  };
  const blockingCodes = (mm) => at(mm).filter((c) => c.level === 'blocking').map((c) => c.code);

  const [slip] = at(300);
  assert.strictEqual(slip.code, 'run1-widthAtFloor-unit-centimetres');
  assert.strictEqual(slip.level, 'blocking');
  assert.strictEqual(slip.suggestionMm, 3000);
  assert.strictEqual(slip.message, '300 looks like centimetres. Did you mean 3000mm for the return width at the floor?');
  assert.deepStrictEqual(blockingCodes(150), ['run1-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blockingCodes(399), ['run1-widthAtFloor-implausible']);
  assert.deepStrictEqual(blockingCodes(400), []);
  assert.deepStrictEqual(blockingCodes(3001), ['run1-widthAtFloor-implausible']);

  // Leaving it out is the same as asking for 400mm on every run.
  for (const mm of [0, 0.3, 5, 30, 90, 99, 100, 150, 300, 399, 400, 900, 3000, 3001]) {
    assert.deepStrictEqual(at(mm), at(mm, { ...bare, minWidthsMm: [400, 400] }), `${mm}mm`);
  }
});

test('a run the context says nothing about falls back to 400mm', () => {
  // Two runs, but a minimum for the first only.
  const ctx = { hasStartWall: true, hasEndWall: false, glassHeightMm: 2000, minWidthsMm: [100] };
  const blockingCodes = (secondRunMm) => {
    const m = createOpeningMeasurements([300, secondRunMm]);
    m.method = 'assumed-square';
    m.shapeConfirmed = true;
    return checkMeasurements(m, ctx).filter((c) => c.level === 'blocking').map((c) => c.code);
  };
  assert.deepStrictEqual(blockingCodes(300), ['run1-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blockingCodes(399), ['run1-widthAtFloor-implausible']);
  assert.deepStrictEqual(blockingCodes(400), []);
});

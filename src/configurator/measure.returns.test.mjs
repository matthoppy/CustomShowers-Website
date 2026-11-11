/**
 * Short return panels. A run with no door in it can be a few hundred
 * millimetres long, and the checks that catch wrong units must not refuse it.
 * Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { TEMPLATES } from './templates.ts';
import { openingContext, runWidthsMm } from './geometry.ts';
import { buildJourney, canLeaveScreen } from './journey.ts';
import { checkMeasurements, createOpeningMeasurements } from './measure.ts';

/**
 * A layout as it starts, with the walls left unchecked so only the widths are
 * in question. Built the way the designer builds one from a template.
 */
function layout(id, widths) {
  const t = TEMPLATES.find((x) => x.id === id);
  const panels = structuredClone(t.panels);
  const junctions = structuredClone(t.junctions);
  const opening = createOpeningMeasurements(runWidthsMm(panels, junctions));
  opening.method = 'assumed-square';
  opening.runs = opening.runs.map((run, i) => ({ ...run, widthAtFloorMm: widths?.[i] ?? run.widthAtFloorMm }));
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

const checksFor = (state) => checkMeasurements(state.opening, openingContext(state));

/** What stops the customer, other than not having confirmed the drawing yet. */
const stops = (checks) =>
  checks.filter((c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed').map((c) => c.code);
const blocking = (state) => stops(checksFor(state));

for (const template of TEMPLATES) {
  test(`${template.id} is not refused at the sizes it starts with`, () => {
    assert.deepStrictEqual(blocking(layout(template.id)), []);
  });
}

for (const width of [150, 200, 300, 399]) {
  test(`a ${width}mm return on a walk-in is a real size`, () => {
    assert.deepStrictEqual(blocking(layout('walk-in-return', [900, width])), []);
  });
}

test('a return typed in centimetres is still caught, with the right size offered', () => {
  const check = checksFor(layout('walk-in-return', [900, 30])).find((c) => c.runIndex === 1);
  assert.strictEqual(check?.code, 'run1-widthAtFloor-unit-centimetres');
  assert.strictEqual(check.level, 'blocking');
  assert.strictEqual(check.suggestionMm, 300);
});

test('a run with a door in it is still held to the size of an opening', () => {
  // The front of a corner shower has the door in it.
  assert.deepStrictEqual(blocking(layout('corner-door-return', [800, 300])), ['run1-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blocking(layout('corner-door-return', [800, 399])), ['run1-widthAtFloor-implausible']);
  assert.deepStrictEqual(blocking(layout('corner-door-return', [800, 400])), []);
  // Its side has not, so it may be short.
  assert.deepStrictEqual(blocking(layout('corner-door-return', [300, 700])), []);
});

test('a single opening between two walls is unchanged', () => {
  assert.deepStrictEqual(blocking(layout('alcove-door', [90])), ['run0-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blocking(layout('alcove-door', [300])), ['run0-widthAtFloor-unit-centimetres']);
  // A fixed panel beside the door does not make the opening a return.
  assert.deepStrictEqual(blocking(layout('alcove-panel-door', [300])), ['run0-widthAtFloor-unit-centimetres']);
});

test('the checks work as before when they are not told about the shape', () => {
  const ctx = { hasStartWall: true, hasEndWall: false, glassHeightMm: 2000 };

  // The check this fix is about, exactly as it was: 300 read as centimetres.
  const before = checkMeasurements(layout('walk-in-return', [900, 300]).opening, ctx);
  assert.deepStrictEqual(
    before.map((c) => [c.code, c.level, c.suggestionMm]),
    [['run1-widthAtFloor-unit-centimetres', 'blocking', 3000]]
  );

  // Every size accepted above is refused without the shape.
  for (const width of [150, 200, 300, 399]) {
    const refused = stops(checkMeasurements(layout('walk-in-return', [900, width]).opening, ctx));
    assert.strictEqual(refused.length, 1, `${width}mm`);
    assert.match(refused[0], /^run1-widthAtFloor-(unit-centimetres|implausible)$/, `${width}mm`);
  }

  // A run the checks were told nothing about is held to an opening too.
  const partial = { ...ctx, minWidthsMm: [100] };
  assert.deepStrictEqual(stops(checkMeasurements(layout('walk-in-return', [900, 300]).opening, partial)), [
    'run1-widthAtFloor-unit-centimetres',
  ]);
});

test('a walk-in with a 300mm return can leave the measuring summary', () => {
  // The Next button on the last measuring screen, as the designer works it out.
  const state = layout('walk-in-return');
  assert.strictEqual(state.opening.runs[1].widthAtFloorMm, 300);
  state.opening.shapeConfirmed = true;
  const summary = buildJourney(state).length - 1;
  assert.strictEqual(buildJourney(state)[summary].kind, 'summary');
  assert.ok(canLeaveScreen(state, summary, checksFor(state)));
});

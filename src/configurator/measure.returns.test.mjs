/**
 * Short return panels. A run with no door in it can be a few hundred
 * millimetres long, and the checks that catch wrong units must not refuse it.
 * Run with: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { TEMPLATES } from './templates.ts';
import { openingContext, runWidthsMm } from './geometry.ts';
import { checkMeasurements, createOpeningMeasurements } from './measure.ts';

/** A layout as it starts, with the walls left unchecked so only the widths are in question. */
function layout(id, widths) {
  const t = TEMPLATES.find((x) => x.id === id);
  const state = {
    panels: t.panels,
    junctions: t.junctions,
    leftWall: t.leftWall,
    rightWall: t.rightWall,
    heightMm: t.heightMm ?? 2000,
    isFloorToCeiling: false,
  };
  const opening = createOpeningMeasurements(runWidthsMm(t.panels, t.junctions));
  opening.method = 'assumed-square';
  opening.runs = opening.runs.map((run, i) => ({ ...run, widthAtFloorMm: widths?.[i] ?? run.widthAtFloorMm }));
  return { state, opening };
}

const blocking = ({ state, opening }) =>
  checkMeasurements(opening, openingContext(state))
    .filter((c) => c.level === 'blocking' && c.code !== 'shape-unconfirmed')
    .map((c) => c.code);

test('no layout is refused at the sizes it starts with', () => {
  for (const t of TEMPLATES) assert.deepStrictEqual(blocking(layout(t.id)), [], t.id);
});

test('a return of 150, 200, 300 or 399mm on a walk-in is a real size', () => {
  for (const width of [150, 200, 300, 399]) {
    assert.deepStrictEqual(blocking(layout('walk-in-return', [900, width])), [], String(width));
  }
});

test('a return typed in centimetres is still caught, with the right size offered', () => {
  const { state, opening } = layout('walk-in-return', [900, 30]);
  const check = checkMeasurements(opening, openingContext(state)).find((c) => c.runIndex === 1);
  assert.strictEqual(check?.code, 'run1-widthAtFloor-unit-centimetres');
  assert.strictEqual(check?.suggestionMm, 300);
});

test('a run with a door in it is still held to the size of an opening', () => {
  // The front of a corner shower has the door in it; its side has not.
  assert.deepStrictEqual(blocking(layout('corner-door-return', [800, 300])), ['run1-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blocking(layout('corner-door-return', [300, 700])), []);
});

test('a single opening between two walls is unchanged', () => {
  assert.deepStrictEqual(blocking(layout('alcove-door', [90])), ['run0-widthAtFloor-unit-centimetres']);
  assert.deepStrictEqual(blocking(layout('alcove-door', [300])), ['run0-widthAtFloor-unit-centimetres']);
});

test('the checks work as before when they are not told about the shape', () => {
  const { opening } = layout('walk-in-return', [900, 300]);
  const ctx = { hasStartWall: true, hasEndWall: false, glassHeightMm: 2000 };
  assert.ok(checkMeasurements(opening, ctx).some((c) => c.code === 'run1-widthAtFloor-unit-centimetres'));
});

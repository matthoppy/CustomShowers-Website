import { describe, expect, it } from 'vitest';
import { applyMeasuredWidths, smallestOf } from './applyMeasurements';
import { getTemplate } from './templates';

const panelsOf = (id: string) => getTemplate(id)!.panels;
const widths = (id: string, m: Record<string, number>) => applyMeasuredWidths(id, panelsOf(id), m).map((p) => p.width_mm);

describe('smallestOf', () => {
  it('takes the narrowest of bottom, middle and top', () => {
    expect(smallestOf({ 'opening-width-bottom': 905, 'opening-width-middle': 902, 'opening-width-top': 908 }, 'opening-width')).toBe(902);
  });
  it('ignores missing readings', () => {
    expect(smallestOf({ 'opening-width-top': 900 }, 'opening-width')).toBe(900);
    expect(smallestOf({}, 'opening-width')).toBeUndefined();
  });
});

describe('applyMeasuredWidths', () => {
  it('sizes a single alcove door to the opening', () => {
    expect(widths('alcove-door', { 'opening-width-bottom': 760, 'opening-width-top': 755 })).toEqual([755]);
  });

  it('keeps the door width and gives the rest to the fixed panel', () => {
    expect(widths('alcove-panel-door', { 'opening-width-bottom': 1200, 'opening-width-top': 1198 })).toEqual([498, 700]);
  });

  it('rebalances when the opening is too narrow for the template door', () => {
    const [fixed, door] = widths('alcove-panel-door', { 'opening-width-bottom': 800 });
    expect(fixed + door).toBe(800);
    expect(fixed).toBeGreaterThanOrEqual(200);
  });

  it('sizes a walk-in screen', () => {
    expect(widths('walk-in', { 'panel-width-bottom': 1000, 'panel-width-top': 996 })).toEqual([996]);
  });

  it('sizes both panels of a walk-in with return', () => {
    expect(
      widths('walk-in-return', {
        'main-panel-width-bottom': 1100,
        'main-panel-width-top': 1102,
        'return-panel-width-bottom': 320,
        'return-panel-width-top': 318,
      })
    ).toEqual([1100, 318]);
  });

  it('sizes the side return and front of a corner', () => {
    expect(
      widths('corner-door-return', {
        'return-depth-bottom': 880,
        'return-depth-top': 878,
        'front-opening-width-bottom': 760,
        'front-opening-width-top': 762,
      })
    ).toEqual([878, 760]);
  });

  it('sizes an over-bath screen', () => {
    expect(widths('over-bath', { 'screen-width-bottom': 820, 'screen-width-top': 815 })).toEqual([815]);
  });

  it('leaves multi-panel layouts without their own plan at template sizes', () => {
    expect(widths('three-sided', { 'opening-width-bottom': 1500 })).toEqual([600, 700, 600]);
  });

  it('does not change the template it was given', () => {
    const original = panelsOf('alcove-door')[0].width_mm;
    applyMeasuredWidths('alcove-door', panelsOf('alcove-door'), { 'opening-width-bottom': 650 });
    expect(panelsOf('alcove-door')[0].width_mm).toBe(original);
  });
});

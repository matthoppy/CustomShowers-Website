import { describe, expect, it } from 'vitest';
import { RATES, suggestPrice, totalsFor, formatPence } from './pricing';
import { buildSpec } from './spec';
import { createInitialState } from './types';

describe('suggestPrice', () => {
  const state = { ...createInitialState(10), heightMm: 2000 };
  const spec = buildSpec(state);
  const price = suggestPrice(state, spec);

  it('prices each panel of glass by its cut area', () => {
    const glass = price.lines.filter((l) => l.category === 'glass');
    expect(glass).toHaveLength(spec.panels.length);
    const p = spec.panels[0];
    const expected = Math.round(Math.max((p.cutWidthMm * p.cutHeightMm) / 1e6, RATES.minPanelAreaM2) * RATES.glassPerM2.clear);
    expect(glass[0].total_pence).toBe(expected);
  });

  it('adds door hardware and delivery', () => {
    const names = price.lines.map((l) => l.description);
    expect(names).toContain('Glass-to-wall hinges');
    expect(names).toContain('Door handle');
    expect(names).toContain('Delivery');
  });

  it('adds 20% VAT to the subtotal', () => {
    const subtotal = price.lines.reduce((s, l) => s + l.total_pence, 0);
    expect(price.subtotal_pence).toBe(subtotal);
    expect(price.vat_pence).toBe(Math.round(subtotal * 0.2));
    expect(price.total_pence).toBe(subtotal + price.vat_pence);
  });

  it('charges easy-clean coating when chosen', () => {
    const coated = suggestPrice({ ...state, glassCoating: 'easy-clean' }, spec);
    expect(coated.total_pence).toBeGreaterThan(price.total_pence);
  });
});

describe('totalsFor', () => {
  it('handles a zero VAT rate', () => {
    const t = totalsFor([{ description: 'x', qty: 2, unit_pence: 500, total_pence: 1000, category: 'other' }], 0);
    expect(t.total_pence).toBe(1000);
  });
});

describe('formatPence', () => {
  it('formats pounds with two decimals', () => {
    expect(formatPence(123456)).toBe('£1,234.56');
  });
});

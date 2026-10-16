/**
 * Suggested price for a design.
 *
 * This is a starting point for the admin, not what the customer is charged:
 * every quote is checked and can be edited before the price is sent. The
 * server never trusts these numbers for payment — it charges what the admin
 * approved, plus extras priced from the catalog.
 *
 * All amounts are pence, ex VAT.
 *
 * PLACEHOLDER RATES — replace with the real price list.
 */

import type { ConfiguratorSpec } from './spec';
import type { ConfiguratorState } from './types';

export const RATES = {
  /** Toughened 10mm, per square metre, by glass type. */
  glassPerM2: {
    clear: 18000,
    'low-iron': 21000,
    satin: 20000,
    bronze: 21000,
    grey: 21000,
  } as Record<string, number>,
  /** Smallest area charged per panel — very small panels still take a full cut and toughen. */
  minPanelAreaM2: 0.3,
  easyCleanPerM2: 2000,
  notch: 1500,
  hinge: 4500,
  handle: 3500,
  doorSeals: 1800,
  channelPerMetre: 2800,
  clamp: 1200,
  supportBar: 6500,
  delivery: 7500,
  vatRate: 0.2,
};

export type PriceCategory = 'glass' | 'hardware' | 'delivery' | 'other';

export interface PriceLine {
  description: string;
  qty: number;
  unit_pence: number;
  total_pence: number;
  category: PriceCategory;
}

export interface PriceBreakdown {
  lines: PriceLine[];
  subtotal_pence: number;
  vat_pence: number;
  total_pence: number;
  vat_rate: number;
}

const GLASS_NAMES: Record<string, string> = {
  clear: 'clear',
  'low-iron': 'low-iron',
  satin: 'satin (frosted)',
  bronze: 'bronze tint',
  grey: 'grey tint',
};

const line = (description: string, qty: number, unit: number, category: PriceCategory): PriceLine => ({
  description,
  qty,
  unit_pence: Math.round(unit),
  total_pence: Math.round(unit) * qty,
  category,
});

/** Adds up lines and VAT. Used for suggestions here and for admin edits on the server. */
export function totalsFor(lines: PriceLine[], vatRate = RATES.vatRate): PriceBreakdown {
  const subtotal = lines.reduce((sum, l) => sum + l.total_pence, 0);
  const vat = Math.round(subtotal * vatRate);
  return { lines, subtotal_pence: subtotal, vat_pence: vat, total_pence: subtotal + vat, vat_rate: vatRate };
}

export function suggestPrice(state: ConfiguratorState, spec: ConfiguratorSpec): PriceBreakdown {
  const lines: PriceLine[] = [];
  const rate = RATES.glassPerM2[state.glassType] ?? RATES.glassPerM2.clear;
  const glassName = GLASS_NAMES[state.glassType] ?? state.glassType;
  let totalArea = 0;

  spec.panels.forEach((p) => {
    const area = Math.max((p.cutWidthMm * p.cutHeightMm) / 1_000_000, RATES.minPanelAreaM2);
    totalArea += area;
    lines.push(
      line(
        `${p.label}: ${spec.glassThicknessMm}mm toughened ${glassName}, ${p.cutWidthMm} × ${p.cutHeightMm}mm`,
        1,
        area * rate,
        'glass'
      )
    );
  });

  if (state.glassCoating === 'easy-clean') {
    lines.push(line(`Easy-clean coating (${totalArea.toFixed(2)}m²)`, 1, totalArea * RATES.easyCleanPerM2, 'glass'));
  }

  const notches = spec.panels.reduce((n, p) => n + p.notches.length, 0);
  if (notches) lines.push(line('Notch cut-outs', notches, RATES.notch, 'glass'));

  const doors = spec.panels.filter((p) => p.door);
  if (doors.length) {
    const hinges = doors.reduce((n, d) => n + (d.cutHeightMm > 2000 ? 3 : 2), 0);
    lines.push(line('Glass-to-wall hinges', hinges, RATES.hinge, 'hardware'));
    lines.push(line('Door handle', doors.length, RATES.handle, 'hardware'));
    lines.push(line('Door seals set', doors.length, RATES.doorSeals, 'hardware'));
  }

  if (spec.mounting === 'channel' && spec.totalChannelLengthMm > 0) {
    // Sold by the metre, rounded up to the next 10cm.
    const metres = Math.ceil(spec.totalChannelLengthMm / 100) / 10;
    lines.push({
      description: `U-channel (${metres.toFixed(1)}m)`,
      qty: 1,
      unit_pence: Math.round(metres * RATES.channelPerMetre),
      total_pence: Math.round(metres * RATES.channelPerMetre),
      category: 'hardware',
    });
  } else if (spec.mounting === 'clamps') {
    const clamps = spec.wallRuns.length * 2 + spec.cornerCount * 2;
    if (clamps) lines.push(line('Glass clamps', clamps, RATES.clamp, 'hardware'));
  }

  if (spec.support.supportBarRequired) lines.push(line('Support bar', 1, RATES.supportBar, 'hardware'));

  lines.push(line('Delivery', 1, RATES.delivery, 'delivery'));

  return totalsFor(lines);
}

export function formatPence(pence: number): string {
  return `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

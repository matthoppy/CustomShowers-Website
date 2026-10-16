/**
 * The customer's site measurements, written out for the workshop.
 *
 * The designer turns the wizard's readings into panel sizes, but the raw
 * readings matter on their own: which walls lean, which sizes the customer
 * wasn't sure of, which warnings they saw and confirmed anyway. Without this
 * record those never leave the browser.
 */

import type { MeasuringResult } from './MeasuringWizard';
import { groupOf } from './measurementChecks';

const HEIGHT_REFERENCE_LABELS: Record<string, string> = {
  'grout-line': 'Grout or tile line',
  'door-frame': 'Door frame or architrave top',
  ceiling: 'Ceiling',
  standard: 'Standard height',
};

const FLOOR_LABELS: Record<string, string> = {
  tray: 'Shower tray',
  'wet-room': 'Wet room (tiled floor)',
  'over-bath': 'Over a bath',
};

const PLUMB_LABELS: Record<string, string> = {
  straight: 'Walls look straight',
  leans: 'A wall leans',
  'not-checked': 'Not checked',
};

export function photoFilename(stepId: string): string {
  return `tape-${stepId}.jpg`;
}

export function formatMeasuringRecord(result: MeasuringResult): string {
  const lines: string[] = [];
  const m = result.measurements;
  const unsure = new Set(result.notSure);
  const mm = (key: string) => (m[key] !== undefined && m[key] !== '' ? `${m[key]}mm` : '—');

  lines.push('SITE MEASUREMENTS (entered by the customer)');
  lines.push(`Layout: ${result.planName}`);
  lines.push(`Measured with: ${result.measuringMethod === 'laser' ? 'Laser level' : 'Tape measure'}`);
  lines.push('');

  for (const [id, title] of Object.entries(result.stepTitles)) {
    let reading: string;
    if (id.startsWith('laser-')) {
      const wall = id.replace('laser-', '');
      const parts = (['bottom', 'middle', 'top'] as const)
        .filter((p) => m[`${wall}-gap-${p}`] !== undefined && m[`${wall}-gap-${p}`] !== '')
        .map((p) => `${p} ${mm(`${wall}-gap-${p}`)}`);
      reading = parts.join(', ') || '—';
      const rake = result.laserGaps?.[wall];
      if (rake) reading += ` → ${rake.description}${rake.warningMessage ? ` (${rake.warningMessage})` : ''}`;
    } else if (id === 'height-reference') {
      reading = HEIGHT_REFERENCE_LABELS[result.heightReference] ?? result.heightReference;
    } else if (id === 'height-measurement') {
      reading = unsure.has(id) ? `NOT SURE — ${result.heightToReferenceMm}mm assumed` : `${result.heightToReferenceMm}mm`;
    } else if (id === 'shower-head-height') {
      reading = result.showerHeadHeightMm ? `${result.showerHeadHeightMm}mm` : '—';
    } else if (id === 'floor-type') {
      reading = result.floorType ? FLOOR_LABELS[result.floorType] : '—';
    } else if (id === 'obstacles') {
      reading = result.obstacles?.length ? result.obstacles.join(', ') : 'None';
    } else if (id === 'plumb-check') {
      reading = result.plumbCheck ? PLUMB_LABELS[result.plumbCheck] ?? result.plumbCheck : 'Skipped';
    } else {
      reading = unsure.has(id) ? `NOT SURE — ${mm(id)} assumed` : mm(id);
    }

    lines.push(`${title}: ${reading}`);
    for (const warning of result.confirmedWarnings[id] ?? []) {
      lines.push(`  ! Customer confirmed despite warning: ${warning}`);
    }
    if (result.photos[id]) lines.push(`  Photo attached: ${photoFilename(id)}`);
  }

  // Smallest of each bottom/middle/top set — what the glass is made to.
  const smallest = new Map<string, number>();
  for (const id of Object.keys(result.stepTitles)) {
    const group = groupOf(id);
    const n = Number(m[id]);
    if (!group || unsure.has(id) || !(n > 0)) continue;
    smallest.set(group, Math.min(n, smallest.get(group) ?? Infinity));
  }
  if (smallest.size) {
    lines.push('');
    lines.push('Smallest readings:');
    for (const [group, n] of smallest) lines.push(`  ${group}: ${n}mm`);
  }

  if (result.headClearanceWarning) {
    lines.push('');
    lines.push(`WARNING: ${result.headClearanceWarning}`);
  }

  return lines.join('\n');
}

/** UTF-8 safe base64 for a text attachment. */
export function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

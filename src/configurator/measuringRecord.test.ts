import { describe, expect, it } from 'vitest';
import { formatMeasuringRecord, textToBase64 } from './measuringRecord';
import type { MeasuringResult } from './MeasuringWizard';

const base: MeasuringResult = {
  measuringMethod: 'tape',
  configurationId: 'alcove-door',
  planName: 'Single door (alcove)',
  measurements: {
    'opening-width-bottom': 905,
    'opening-width-middle': 902,
    'opening-width-top': 930,
    'shower-head-height': 1850,
  },
  heightReference: 'grout-line',
  heightToReferenceMm: 2000,
  showerHeadHeightMm: 1850,
  notSure: [],
  confirmedWarnings: { 'opening-width-top': ['These differ by 28mm'] },
  photos: { 'opening-width-top': 'data:image/jpeg;base64,AAAA' },
  stepTitles: {
    'opening-width-bottom': 'Opening width at the bottom',
    'opening-width-middle': 'Opening width at the middle',
    'opening-width-top': 'Opening width at the top',
    'height-measurement': 'Height to reference point',
    'shower-head-height': 'Shower head height',
  },
};

describe('formatMeasuringRecord', () => {
  const text = formatMeasuringRecord(base);

  it('lists every reading in the order measured', () => {
    expect(text).toContain('Opening width at the bottom: 905mm');
    expect(text.indexOf('bottom: 905')).toBeLessThan(text.indexOf('top: 930'));
  });

  it('flags warnings the customer confirmed anyway', () => {
    expect(text).toContain('Customer confirmed despite warning: These differ by 28mm');
  });

  it('notes attached photos and the smallest reading', () => {
    expect(text).toContain('Photo attached: tape-opening-width-top.jpg');
    expect(text).toContain('opening-width: 902mm');
  });

  it('marks sizes the customer wasn’t sure of', () => {
    const unsure = formatMeasuringRecord({ ...base, notSure: ['height-measurement'] });
    expect(unsure).toContain('Height to reference point: NOT SURE — 2000mm assumed');
  });
});

describe('textToBase64', () => {
  it('round-trips non-ASCII text', () => {
    const encoded = textToBase64('Customer’s 900mm — ok');
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)));
    expect(decoded).toBe('Customer’s 900mm — ok');
  });
});

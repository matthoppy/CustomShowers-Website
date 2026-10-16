import { describe, it, expect } from 'vitest';
import { calculateRake, formatRakeForDisplay, type LaserGapMeasurements } from './rakeCalculations';

describe('calculateRake', () => {
  it('calculates positive rake when wall leans out at the top', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapBottomMm: 48,
      heightMm: 1950,
    };

    const result = calculateRake(gaps, 'Left wall');

    expect(result.rakeMm).toBe(2);
    expect(result.description).toBe('Left wall leans out 2mm at the top over 1950mm');
    expect(result.isBowed).toBe(false);
    expect(result.needsDoubleCheck).toBe(false);
  });

  it('calculates negative rake when wall leans in at the top', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 45,
      gapBottomMm: 50,
      heightMm: 2000,
    };

    const result = calculateRake(gaps, 'Right wall');

    expect(result.rakeMm).toBe(-5);
    expect(result.description).toBe('Right wall leans in 5mm at the top over 2000mm');
    expect(result.isBowed).toBe(false);
    expect(result.needsDoubleCheck).toBe(false);
  });

  it('identifies plumb wall when rake is negligible', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapBottomMm: 50,
      heightMm: 2100,
    };

    const result = calculateRake(gaps, 'Back wall');

    expect(result.rakeMm).toBe(0);
    expect(result.description).toBe('Back wall is plumb (vertical) over 2100mm');
    expect(result.needsDoubleCheck).toBe(false);
  });

  it('flags significant rake for double-checking', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 65,
      gapBottomMm: 50,
      heightMm: 2000,
    };

    const result = calculateRake(gaps, 'Left wall');

    expect(result.rakeMm).toBe(15);
    expect(result.needsDoubleCheck).toBe(true);
    expect(result.warningMessage).toContain('please double-check');
  });

  it('detects bowed wall when middle measurement is off', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapMiddleMm: 56,
      gapBottomMm: 50,
      heightMm: 2000,
    };

    const result = calculateRake(gaps, 'Right wall');

    expect(result.rakeMm).toBe(0);
    expect(result.isBowed).toBe(true);
    expect(result.bowMm).toBe(6);
    expect(result.warningMessage).toContain('bowed');
  });

  it('does not report bow when middle measurement is close to expected', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapMiddleMm: 49,
      gapBottomMm: 48,
      heightMm: 2000,
    };

    const result = calculateRake(gaps, 'Left wall');

    expect(result.isBowed).toBe(false);
    expect(result.bowMm).toBeUndefined();
  });

  it('handles large negative rake with warning', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 40,
      gapBottomMm: 52,
      heightMm: 1950,
    };

    const result = calculateRake(gaps, 'Back wall');

    expect(result.rakeMm).toBe(-12);
    expect(result.needsDoubleCheck).toBe(true);
    expect(result.warningMessage).toContain('12mm');
    expect(result.warningMessage).toContain('double-check');
  });
});

describe('formatRakeForDisplay', () => {
  it('formats rake measurements with two points', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapBottomMm: 48,
      heightMm: 1950,
    };

    const display = formatRakeForDisplay(gaps, 'Left wall');

    expect(display).toContain('Left wall: Top 50mm');
    expect(display).toContain('Bottom 48mm');
    expect(display).toContain('leans out 2mm');
    expect(display).not.toContain('Middle');
  });

  it('formats rake measurements with three points', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapMiddleMm: 49,
      gapBottomMm: 48,
      heightMm: 2000,
    };

    const display = formatRakeForDisplay(gaps, 'Right wall');

    expect(display).toContain('Right wall: Top 50mm');
    expect(display).toContain('Middle 49mm');
    expect(display).toContain('Bottom 48mm');
  });

  it('includes warning in formatted output when present', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 65,
      gapBottomMm: 50,
      heightMm: 2000,
    };

    const display = formatRakeForDisplay(gaps, 'Left wall');

    expect(display).toContain('⚠️');
    expect(display).toContain('double-check');
  });

  it('formats plumb wall correctly', () => {
    const gaps: LaserGapMeasurements = {
      gapTopMm: 50,
      gapBottomMm: 50,
      heightMm: 2100,
    };

    const display = formatRakeForDisplay(gaps, 'Back wall');

    expect(display).toContain('is plumb (vertical)');
  });
});

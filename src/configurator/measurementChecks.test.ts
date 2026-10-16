import { describe, expect, it } from 'vitest';
import { checkSpread, checkValue, groupOf, issuesForStep } from './measurementChecks';

describe('checkValue', () => {
  it('accepts ordinary widths and heights', () => {
    expect(checkValue('opening-width-bottom', '900')).toBeNull();
    expect(checkValue('height-measurement', '2000')).toBeNull();
    expect(checkValue('shower-head-height', '1850')).toBeNull();
  });

  it('ignores empty input', () => {
    expect(checkValue('opening-width-bottom', '')).toBeNull();
  });

  it('spots centimetres and suggests millimetres', () => {
    const issue = checkValue('opening-width-bottom', '90');
    expect(issue?.severity).toBe('confirm');
    expect(issue?.suggestionMm).toBe(900);
    expect(checkValue('height-measurement', '200')?.suggestionMm).toBe(2000);
  });

  it('spots metres and suggests millimetres', () => {
    expect(checkValue('opening-width-top', '0.9')?.suggestionMm).toBe(900);
    expect(checkValue('height-measurement', '2.1')?.suggestionMm).toBe(2100);
  });

  it('blocks an impossible size and offers the likely intended one', () => {
    const issue = checkValue('opening-width-bottom', '9000');
    expect(issue?.severity).toBe('block');
    expect(issue?.suggestionMm).toBe(900);
  });

  it('asks to confirm an unusually large but possible size', () => {
    expect(checkValue('opening-width-bottom', '2800')?.severity).toBe('confirm');
  });

  it('blocks zero, negatives and non-numbers', () => {
    expect(checkValue('opening-width-bottom', '0')?.severity).toBe('block');
    expect(checkValue('opening-width-bottom', '-5')?.severity).toBe('block');
    expect(checkValue('opening-width-bottom', 'abc')?.severity).toBe('block');
  });

  it('allows a zero laser gap but questions a large one', () => {
    expect(checkValue('left-wall-gap-bottom', '0')).toBeNull();
    expect(checkValue('left-wall-gap-bottom', '200')?.severity).toBe('confirm');
  });

  it('leaves steps without a numeric measurement alone', () => {
    expect(checkValue('floor-type', 'tray')).toBeNull();
  });
});

describe('checkSpread', () => {
  it('groups bottom, middle and top of one measurement', () => {
    expect(groupOf('opening-width-top')).toBe('opening-width');
    expect(groupOf('return-depth-bottom')).toBe('return-depth');
    expect(groupOf('left-wall-gap-top')).toBeNull();
  });

  it('is quiet when readings agree to within 15mm', () => {
    const values = { 'opening-width-bottom': '900', 'opening-width-top': '912' };
    expect(checkSpread('opening-width-top', values)).toBeNull();
  });

  it('asks for a re-measure when readings differ by more than 15mm', () => {
    const values = { 'opening-width-bottom': '900', 'opening-width-middle': '905', 'opening-width-top': '925' };
    const issue = checkSpread('opening-width-top', values);
    expect(issue?.severity).toBe('confirm');
    expect(issue?.message).toContain('25mm');
  });

  it('says a large difference is probably a misread', () => {
    const values = { 'opening-width-bottom': '900', 'opening-width-top': '1000' };
    expect(checkSpread('opening-width-top', values)?.message).toContain('probably misread');
  });

  it('needs at least two readings', () => {
    expect(checkSpread('opening-width-bottom', { 'opening-width-bottom': '900' })).toBeNull();
  });
});

describe('issuesForStep', () => {
  it('puts blocking problems first', () => {
    const values = { 'opening-width-bottom': '900', 'opening-width-top': '9000' };
    const issues = issuesForStep('opening-width-top', values);
    expect(issues[0].severity).toBe('block');
    expect(issues).toHaveLength(2);
  });
});

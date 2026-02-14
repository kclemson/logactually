import { describe, it, expect } from 'vitest';
import {
  convertWeight,
  formatWeight,
  formatWeightWithUnit,
  parseWeightToLbs,
  getWeightUnitLabel,
  formatDurationMmSs,
} from './weight-units';

// ---------------------------------------------------------------------------
// convertWeight
// ---------------------------------------------------------------------------

describe('convertWeight', () => {
  it('returns same value for same-unit conversion', () => {
    expect(convertWeight(100, 'lbs', 'lbs')).toBe(100);
    expect(convertWeight(50, 'kg', 'kg')).toBe(50);
  });

  it('converts lbs to kg', () => {
    expect(convertWeight(100, 'lbs', 'kg')).toBeCloseTo(45.36, 1);
  });

  it('converts kg to lbs', () => {
    expect(convertWeight(100, 'kg', 'lbs')).toBeCloseTo(220.46, 1);
  });
});

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------

describe('formatWeight', () => {
  it('formats lbs as-is', () => {
    expect(formatWeight(135, 'lbs')).toBe('135.0');
  });

  it('formats lbs to kg with conversion', () => {
    expect(formatWeight(100, 'kg')).toBe('45.4');
  });

  it('respects custom decimals', () => {
    expect(formatWeight(135, 'lbs', 0)).toBe('135');
    expect(formatWeight(135, 'lbs', 2)).toBe('135.00');
  });
});

// ---------------------------------------------------------------------------
// formatWeightWithUnit
// ---------------------------------------------------------------------------

describe('formatWeightWithUnit', () => {
  it('appends lbs unit', () => {
    expect(formatWeightWithUnit(135, 'lbs')).toBe('135.0 lbs');
  });

  it('appends kg unit with conversion', () => {
    expect(formatWeightWithUnit(100, 'kg')).toBe('45.4 kg');
  });
});

// ---------------------------------------------------------------------------
// parseWeightToLbs
// ---------------------------------------------------------------------------

describe('parseWeightToLbs', () => {
  it('passes through lbs input', () => {
    expect(parseWeightToLbs(135, 'lbs')).toBe(135);
  });

  it('converts kg input to lbs', () => {
    expect(parseWeightToLbs(100, 'kg')).toBeCloseTo(220.46, 1);
  });
});

// ---------------------------------------------------------------------------
// getWeightUnitLabel
// ---------------------------------------------------------------------------

describe('getWeightUnitLabel', () => {
  it('returns "Lbs" for lbs', () => {
    expect(getWeightUnitLabel('lbs')).toBe('Lbs');
  });

  it('returns "Kg" for kg', () => {
    expect(getWeightUnitLabel('kg')).toBe('Kg');
  });
});

// ---------------------------------------------------------------------------
// formatDurationMmSs
// ---------------------------------------------------------------------------

describe('formatDurationMmSs', () => {
  it('formats minutes and seconds', () => {
    expect(formatDurationMmSs(5.5)).toBe('5:30');
  });

  it('formats zero', () => {
    expect(formatDurationMmSs(0)).toBe('0:00');
  });

  it('pads seconds with leading zero', () => {
    expect(formatDurationMmSs(1.05)).toBe('1:03');
  });

  it('formats hours when >= 60 minutes', () => {
    expect(formatDurationMmSs(65)).toBe('1:05:00');
  });

  it('formats exactly 60 minutes', () => {
    expect(formatDurationMmSs(60)).toBe('1:00:00');
  });

  it('formats hours with seconds', () => {
    expect(formatDurationMmSs(90.5)).toBe('1:30:30');
  });
});

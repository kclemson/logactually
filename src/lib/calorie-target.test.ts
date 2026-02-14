import { describe, it, expect } from 'vitest';
import { getTargetDotColor } from './calorie-target';

describe('getTargetDotColor', () => {
  const target = 2000;

  it('returns green when at target', () => {
    expect(getTargetDotColor(2000, target)).toContain('green');
  });

  it('returns green when under target', () => {
    expect(getTargetDotColor(1800, target)).toContain('green');
  });

  it('returns green when <= 2.5% over', () => {
    // 2.5% of 2000 = 50 → 2050
    expect(getTargetDotColor(2050, target)).toContain('green');
  });

  it('returns amber when > 2.5% and <= 10% over', () => {
    // 5% over = 2100
    expect(getTargetDotColor(2100, target)).toContain('amber');
  });

  it('returns amber at exactly 10% boundary', () => {
    // 10% of 2000 = 200 → 2200
    expect(getTargetDotColor(2200, target)).toContain('amber');
  });

  it('returns rose when > 10% over', () => {
    // 15% over = 2300
    expect(getTargetDotColor(2300, target)).toContain('rose');
  });

  it('returns green for zero calories', () => {
    expect(getTargetDotColor(0, target)).toContain('green');
  });
});

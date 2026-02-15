import { describe, it, expect } from 'vitest';
import { getTargetDotColor, getEffectiveDailyTarget, computeTDEE, suggestActivityLevel, ACTIVITY_MULTIPLIERS } from './calorie-target';
import type { UserSettings } from '@/hooks/useUserSettings';

// ---------------------------------------------------------------------------
// getTargetDotColor (existing tests)
// ---------------------------------------------------------------------------

describe('getTargetDotColor', () => {
  const target = 2000;

  it('returns green when at target', () => {
    expect(getTargetDotColor(2000, target)).toContain('green');
  });

  it('returns green when under target', () => {
    expect(getTargetDotColor(1800, target)).toContain('green');
  });

  it('returns green when <= 2.5% over', () => {
    expect(getTargetDotColor(2050, target)).toContain('green');
  });

  it('returns amber when > 2.5% and <= 10% over', () => {
    expect(getTargetDotColor(2100, target)).toContain('amber');
  });

  it('returns amber at exactly 10% boundary', () => {
    expect(getTargetDotColor(2200, target)).toContain('amber');
  });

  it('returns rose when > 10% over', () => {
    expect(getTargetDotColor(2300, target)).toContain('rose');
  });

  it('returns green for zero calories', () => {
    expect(getTargetDotColor(0, target)).toContain('green');
  });
});

// ---------------------------------------------------------------------------
// computeTDEE
// ---------------------------------------------------------------------------

describe('computeTDEE', () => {
  it('multiplies BMR by activity multiplier', () => {
    expect(computeTDEE(1500, 'sedentary')).toBe(1500 * 1.2);
    expect(computeTDEE(1500, 'active')).toBe(1500 * 1.725);
  });
});

// ---------------------------------------------------------------------------
// suggestActivityLevel
// ---------------------------------------------------------------------------

describe('suggestActivityLevel', () => {
  it('returns sedentary for low burn', () => {
    expect(suggestActivityLevel(50)).toBe('sedentary');
  });
  it('returns light for moderate burn', () => {
    expect(suggestActivityLevel(150)).toBe('light');
  });
  it('returns moderate for higher burn', () => {
    expect(suggestActivityLevel(350)).toBe('moderate');
  });
  it('returns active for high burn', () => {
    expect(suggestActivityLevel(500)).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// getEffectiveDailyTarget
// ---------------------------------------------------------------------------

const baseSettings: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,
  showCustomLogs: false,
  suggestMealSaves: true,
  suggestRoutineSaves: true,
  dailyCalorieTarget: 2000,
  calorieTargetEnabled: true,
  calorieTargetMode: 'static',
  activityLevel: null,
  dailyDeficit: null,
  calorieBurnEnabled: true,
  bodyWeightLbs: 170,
  heightInches: 70,
  heightUnit: 'ft',
  age: 30,
  bodyComposition: 'male',
  defaultIntensity: null,
};

describe('getEffectiveDailyTarget', () => {
  it('returns null when feature is disabled', () => {
    expect(getEffectiveDailyTarget({ ...baseSettings, calorieTargetEnabled: false })).toBeNull();
  });

  it('returns static target in static mode', () => {
    expect(getEffectiveDailyTarget(baseSettings)).toBe(2000);
  });

  it('returns null in static mode when no target set', () => {
    expect(getEffectiveDailyTarget({ ...baseSettings, dailyCalorieTarget: null })).toBeNull();
  });

  it('computes TDEE-based target in deficit mode', () => {
    const s = { ...baseSettings, calorieTargetMode: 'deficit' as const, activityLevel: 'light' as const, dailyDeficit: 500 };
    const result = getEffectiveDailyTarget(s);
    expect(result).not.toBeNull();
    // Should be BMR * 1.375 - 500
    expect(result!).toBeGreaterThan(1000);
    expect(result!).toBeLessThan(3000);
  });

  it('returns null in deficit mode without activity level', () => {
    const s = { ...baseSettings, calorieTargetMode: 'deficit' as const, activityLevel: null, dailyDeficit: 500 };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });

  it('returns null in deficit mode without body weight', () => {
    const s = { ...baseSettings, calorieTargetMode: 'deficit' as const, activityLevel: 'light' as const, dailyDeficit: 500, bodyWeightLbs: null };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });
});

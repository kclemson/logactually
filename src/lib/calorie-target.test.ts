import { describe, it, expect } from 'vitest';
import { getTargetDotColor, getEffectiveDailyTarget, computeTDEE, suggestActivityLevel, getExerciseAdjustedTarget, usesActualExerciseBurns, ACTIVITY_MULTIPLIERS, getRollupDotColor, computeCalorieRollup, describeCalorieTarget } from './calorie-target';
import { format, subDays } from 'date-fns';
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
// getExerciseAdjustedTarget
// ---------------------------------------------------------------------------

describe('getExerciseAdjustedTarget', () => {
  it('adds base and daily burn', () => {
    expect(getExerciseAdjustedTarget(1800, 300)).toBe(2100);
  });
  it('rounds the result', () => {
    expect(getExerciseAdjustedTarget(1800, 299.7)).toBe(2100);
  });
  it('returns base when no burn', () => {
    expect(getExerciseAdjustedTarget(2000, 0)).toBe(2000);
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

  it('computes TDEE-based target in body_stats mode', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const, dailyDeficit: 500 };
    const result = getEffectiveDailyTarget(s);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(1000);
    expect(result!).toBeLessThan(3000);
  });

  it('returns null in body_stats mode without activity level', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: null, dailyDeficit: 500 };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });

  it('returns null in body_stats mode without body weight', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const, dailyDeficit: 500, bodyWeightLbs: null };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });

  it('returns dailyCalorieTarget in exercise_adjusted mode', () => {
    const s = { ...baseSettings, calorieTargetMode: 'exercise_adjusted' as const, dailyCalorieTarget: 1800 };
    expect(getEffectiveDailyTarget(s)).toBe(1800);
  });

  it('returns null in exercise_adjusted mode without target', () => {
    const s = { ...baseSettings, calorieTargetMode: 'exercise_adjusted' as const, dailyCalorieTarget: null };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });

  it('returns BMR × 1.2 - deficit in body_stats mode with logged activity', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 500 };
    const result = getEffectiveDailyTarget(s);
    expect(result).not.toBeNull();
    // Should be BMR × 1.2 (sedentary) - 500
    expect(result!).toBeGreaterThan(1000);
    expect(result!).toBeLessThan(2500);
  });

  it('returns null in body_stats + logged mode without body weight', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 500, bodyWeightLbs: null };
    expect(getEffectiveDailyTarget(s)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// usesActualExerciseBurns
// ---------------------------------------------------------------------------

describe('usesActualExerciseBurns', () => {
  it('returns true for exercise_adjusted mode', () => {
    expect(usesActualExerciseBurns({ ...baseSettings, calorieTargetMode: 'exercise_adjusted' })).toBe(true);
  });

  it('returns true for body_stats + logged', () => {
    expect(usesActualExerciseBurns({ ...baseSettings, calorieTargetMode: 'body_stats', activityLevel: 'logged' })).toBe(true);
  });

  it('returns false for body_stats + light', () => {
    expect(usesActualExerciseBurns({ ...baseSettings, calorieTargetMode: 'body_stats', activityLevel: 'light' })).toBe(false);
  });

  it('returns false for static mode', () => {
    expect(usesActualExerciseBurns(baseSettings)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getRollupDotColor (stricter thresholds)
// ---------------------------------------------------------------------------

describe('getRollupDotColor', () => {
  it('returns green when under target', () => {
    expect(getRollupDotColor(1800, 2000)).toContain('green');
  });
  it('returns green when exactly at target', () => {
    expect(getRollupDotColor(2000, 2000)).toContain('green');
  });
  it('returns amber when 3% over', () => {
    expect(getRollupDotColor(2060, 2000)).toContain('amber');
  });
  it('returns rose when 6% over', () => {
    expect(getRollupDotColor(2120, 2000)).toContain('rose');
  });
});

// ---------------------------------------------------------------------------
// computeCalorieRollup
// ---------------------------------------------------------------------------

describe('computeCalorieRollup', () => {
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');
  const tenDaysAgo = format(subDays(new Date(), 10), 'yyyy-MM-dd');
  const emptyBurns = new Map<string, number>();

  it('returns null with fewer than 2 days of data', () => {
    const result = computeCalorieRollup(
      [{ date: yesterday, totalCalories: 1800 }],
      7, 2000, false, emptyBurns,
    );
    expect(result).toBeNull();
  });

  it('returns null with 0 days of data', () => {
    expect(computeCalorieRollup([], 7, 2000, false, emptyBurns)).toBeNull();
  });

  it('returns green when average is under target', () => {
    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 1800 },
        { date: twoDaysAgo, totalCalories: 1900 },
      ],
      7, 2000, false, emptyBurns,
    );
    expect(result).not.toBeNull();
    expect(result!.avgIntake).toBe(1850);
    expect(result!.dotColor).toContain('green');
    expect(result!.dayCount).toBe(2);
  });

  it('returns rose when average is well over target', () => {
    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 2500 },
        { date: twoDaysAgo, totalCalories: 2400 },
      ],
      7, 2000, false, emptyBurns,
    );
    expect(result!.dotColor).toContain('rose');
  });

  it('excludes today from the window', () => {
    const result = computeCalorieRollup(
      [
        { date: today, totalCalories: 5000 },
        { date: yesterday, totalCalories: 1800 },
        { date: twoDaysAgo, totalCalories: 1900 },
      ],
      7, 2000, false, emptyBurns,
    );
    expect(result!.avgIntake).toBe(1850);
  });

  it('handles exercise-adjusted targets', () => {
    const burns = new Map<string, number>();
    burns.set(yesterday, 300);
    burns.set(twoDaysAgo, 200);
    // base 1800 + burns → targets are 2100 and 2000, avg target = 2050
    // intake avg = 2000, under target → green
    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 2000 },
        { date: twoDaysAgo, totalCalories: 2000 },
      ],
      7, 1800, true, burns,
    );
    expect(result!.dotColor).toContain('green');
  });

  it('7-day window excludes older data', () => {
    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 1800 },
        { date: twoDaysAgo, totalCalories: 1900 },
        { date: tenDaysAgo, totalCalories: 5000 },
      ],
      7, 2000, false, emptyBurns,
    );
    expect(result!.avgIntake).toBe(1850);
    expect(result!.dayCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// describeCalorieTarget
// ---------------------------------------------------------------------------


describe('describeCalorieTarget', () => {
  it('returns null when target is disabled', () => {
    expect(describeCalorieTarget({ ...baseSettings, calorieTargetEnabled: false })).toBeNull();
  });

  it('returns static description', () => {
    expect(describeCalorieTarget(baseSettings)).toBe('Target: 2,000 cal/day');
  });

  it('returns exercise adjusted description', () => {
    const s = { ...baseSettings, calorieTargetMode: 'exercise_adjusted' as const, dailyCalorieTarget: 1800 };
    expect(describeCalorieTarget(s)).toBe('Target: 1,800 cal/day + exercise');
  });

  it('returns body stats description with fixed activity', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const, dailyDeficit: 500 };
    const result = describeCalorieTarget(s);
    expect(result).toContain('cal/day (from TDEE)');
    expect(result).not.toContain('exercise');
  });

  it('returns body stats + logged description', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 500 };
    const result = describeCalorieTarget(s);
    expect(result).toContain('cal/day + exercise (from TDEE)');
  });

  it('returns null when body stats lacks biometrics', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const, bodyWeightLbs: null };
    expect(describeCalorieTarget(s)).toBeNull();
  });
});

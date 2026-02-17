import { describe, it, expect } from 'vitest';
import { getTargetDotColor, getEffectiveDailyTarget, computeTDEE, suggestActivityLevel, getExerciseAdjustedTarget, usesActualExerciseBurns, ACTIVITY_MULTIPLIERS, getRollupDotColor, computeCalorieRollup, describeCalorieTarget, getCalorieTargetComponents, computeWeekRollup, DAILY_GREEN_MAX, DAILY_AMBER_MAX, ROLLUP_GREEN_MAX, ROLLUP_AMBER_MAX } from './calorie-target';
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
  weekStartDay: 0,
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

  it('returns body stats + logged description with formula', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 500 };
    const result = describeCalorieTarget(s);
    expect(result).toContain('+ exercise - 500');
    expect(result).toContain('cal/day');
    expect(result).not.toContain('from TDEE');
  });

  it('returns body stats + logged description without deficit when 0', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 0 };
    const result = describeCalorieTarget(s);
    expect(result).toContain('+ exercise cal/day');
    expect(result).not.toContain(' - ');
  });

  it('returns null when body stats lacks biometrics', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const, bodyWeightLbs: null };
    expect(describeCalorieTarget(s)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getCalorieTargetComponents
// ---------------------------------------------------------------------------

describe('getCalorieTargetComponents', () => {
  it('returns tdee and deficit for body_stats + logged', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: 500 };
    const result = getCalorieTargetComponents(s);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('body_stats_logged');
    expect(result!.deficit).toBe(500);
    expect(result!.tdee).toBeGreaterThan(1000);
  });

  it('returns deficit 0 when not set', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, dailyDeficit: null };
    const result = getCalorieTargetComponents(s);
    expect(result).not.toBeNull();
    expect(result!.deficit).toBe(0);
  });

  it('returns null for static mode', () => {
    expect(getCalorieTargetComponents(baseSettings)).toBeNull();
  });

  it('returns exercise_adjusted components with baseTarget', () => {
    const s = { ...baseSettings, calorieTargetMode: 'exercise_adjusted' as const, dailyCalorieTarget: 1500 };
    const result = getCalorieTargetComponents(s);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('exercise_adjusted');
    expect(result!.baseTarget).toBe(1500);
    expect(result!.tdee).toBe(0);
    expect(result!.deficit).toBe(0);
  });

  it('returns exercise_adjusted with null dailyCalorieTarget', () => {
    const s = { ...baseSettings, calorieTargetMode: 'exercise_adjusted' as const, dailyCalorieTarget: null };
    const result = getCalorieTargetComponents(s);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('exercise_adjusted');
    expect(result!.baseTarget).toBeNull();
  });

  it('returns body_stats_multiplier for body_stats with fixed activity level', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'light' as const };
    const result = getCalorieTargetComponents(s);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('body_stats_multiplier');
    expect(result!.tdee).toBeGreaterThan(1000);
    expect(result!.deficit).toBe(0);
  });

  it('returns null when disabled', () => {
    const s = { ...baseSettings, calorieTargetEnabled: false, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const };
    expect(getCalorieTargetComponents(s)).toBeNull();
  });

  it('returns null without body weight', () => {
    const s = { ...baseSettings, calorieTargetMode: 'body_stats' as const, activityLevel: 'logged' as const, bodyWeightLbs: null };
    expect(getCalorieTargetComponents(s)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Exercise-adjusted equation math (end-to-end)
// ---------------------------------------------------------------------------

describe('exercise-adjusted equation math', () => {
  it('getExerciseAdjustedTarget adds base + burn correctly', () => {
    // User base target 1500, burned 300 → adjusted = 1800
    expect(getExerciseAdjustedTarget(1500, 300)).toBe(1800);
    expect(getExerciseAdjustedTarget(1500, 0)).toBe(1500);
  });

  it('computeCalorieRollup averages burns for exercise-adjusted', () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    const burns = new Map<string, number>();
    burns.set(yesterday, 400);
    burns.set(twoDaysAgo, 200);

    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 1900 },
        { date: twoDaysAgo, totalCalories: 1700 },
      ],
      7, 1500, true, burns,
    );
    expect(result).not.toBeNull();
    // avg burn = (400+200)/2 = 300
    expect(result!.avgBurn).toBe(300);
    // avg intake = (1900+1700)/2 = 1800
    expect(result!.avgIntake).toBe(1800);
    // avg target = (1500+400 + 1500+200)/2 = 1800 → intake == target → green
    expect(result!.dotColor).toContain('green');
  });

  it('rollup with zero burns still works', () => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    const burns = new Map<string, number>();
    // no burns set

    const result = computeCalorieRollup(
      [
        { date: yesterday, totalCalories: 1600 },
        { date: twoDaysAgo, totalCalories: 1400 },
      ],
      7, 1500, true, burns,
    );
    expect(result).not.toBeNull();
    expect(result!.avgBurn).toBe(0);
    // target stays 1500, avg intake 1500 → green
    expect(result!.avgIntake).toBe(1500);
    expect(result!.dotColor).toContain('green');
  });
});

// ---------------------------------------------------------------------------
// computeWeekRollup
// ---------------------------------------------------------------------------

describe('computeWeekRollup', () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgo = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const threeDaysAgo = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const tenDaysAgo = format(subDays(new Date(), 10), 'yyyy-MM-dd');
  const emptyBurns = new Map<string, number>();

  it('returns null with fewer than 2 days', () => {
    const result = computeWeekRollup(
      [{ date: yesterday, totalCalories: 1800 }],
      tenDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result).toBeNull();
  });

  it('returns result scoped to the given range', () => {
    const result = computeWeekRollup(
      [
        { date: yesterday, totalCalories: 1800 },
        { date: twoDaysAgo, totalCalories: 1900 },
        { date: tenDaysAgo, totalCalories: 5000 }, // outside range
      ],
      threeDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result).not.toBeNull();
    expect(result!.avgIntake).toBe(1850);
    expect(result!.dayCount).toBe(2);
  });

  it('excludes today', () => {
    const result = computeWeekRollup(
      [
        { date: today, totalCalories: 9999 },
        { date: yesterday, totalCalories: 1800 },
        { date: twoDaysAgo, totalCalories: 1900 },
      ],
      threeDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result!.avgIntake).toBe(1850);
  });

  it('uses rollup dot color thresholds (green at/under)', () => {
    const result = computeWeekRollup(
      [
        { date: yesterday, totalCalories: 2000 },
        { date: twoDaysAgo, totalCalories: 2000 },
      ],
      threeDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result!.dotColor).toContain('green');
  });

  it('uses rollup dot color thresholds (amber 1-5% over)', () => {
    const result = computeWeekRollup(
      [
        { date: yesterday, totalCalories: 2060 },
        { date: twoDaysAgo, totalCalories: 2060 },
      ],
      threeDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result!.dotColor).toContain('amber');
  });

  it('uses rollup dot color thresholds (rose >5% over)', () => {
    const result = computeWeekRollup(
      [
        { date: yesterday, totalCalories: 2200 },
        { date: twoDaysAgo, totalCalories: 2200 },
      ],
      threeDaysAgo, today, 2000, false, emptyBurns,
    );
    expect(result!.dotColor).toContain('rose');
  });

  it('handles exercise burns', () => {
    const burns = new Map<string, number>();
    burns.set(yesterday, 400);
    burns.set(twoDaysAgo, 200);
    const result = computeWeekRollup(
      [
        { date: yesterday, totalCalories: 2000 },
        { date: twoDaysAgo, totalCalories: 2000 },
      ],
      threeDaysAgo, today, 1800, true, burns,
    );
    expect(result!.avgBurn).toBe(300);
    expect(result!.avgIntake).toBe(2000);
  });
});

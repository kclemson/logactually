import { computeAbsoluteBMR } from './calorie-burn';
import { format, subDays } from 'date-fns';
import type { UserSettings } from '@/hooks/useUserSettings';

// ---------------------------------------------------------------------------
// Calorie target dot color (existing)
// ---------------------------------------------------------------------------

export function getTargetDotColor(calories: number, target: number): string {
  const overPercent = ((calories - target) / target) * 100;
  if (overPercent <= 2.5) return "text-green-500 dark:text-green-400";
  if (overPercent <= 10) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

// ---------------------------------------------------------------------------
// Activity multipliers (Harris-Benedict / standard tiers)
// ---------------------------------------------------------------------------

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'logged';
export type MultiplierActivityLevel = Exclude<ActivityLevel, 'logged'>;

export const ACTIVITY_MULTIPLIERS: Record<MultiplierActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: 'Sedentary', description: 'Desk job, little exercise' },
  light: { label: 'Lightly active', description: 'Light exercise 1-3 days/wk' },
  moderate: { label: 'Moderately active', description: 'Moderate exercise 3-5 days/wk' },
  active: { label: 'Active', description: 'Hard exercise 6-7 days/wk' },
  logged: { label: 'Use my exercise logs', description: 'Actual logged exercise burns' },
};

// ---------------------------------------------------------------------------
// Target mode options (used by CalorieTargetDialog dropdown)
// ---------------------------------------------------------------------------

export type CalorieTargetMode = 'static' | 'body_stats' | 'exercise_adjusted';

export const TARGET_MODE_OPTIONS: { value: CalorieTargetMode; label: string; description: string }[] = [
  { value: 'static', label: 'Fixed number', description: 'You set a specific calorie target' },
  { value: 'exercise_adjusted', label: 'Exercise adjusted', description: 'Logged exercise offsets your food intake' },
  { value: 'body_stats', label: 'Estimated burn rate minus a deficit', description: 'Calculated from your activity level, weight, and height' },
];

// ---------------------------------------------------------------------------
// TDEE computation
// ---------------------------------------------------------------------------

export function computeTDEE(bmr: number, activityLevel: Exclude<ActivityLevel, 'logged'>): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

// ---------------------------------------------------------------------------
// Effective daily target resolver
// ---------------------------------------------------------------------------

/**
 * Resolves the effective daily calorie target based on user settings.
 * - Static mode: returns the raw `dailyCalorieTarget` value.
 * - Body stats mode: computes BMR × activity multiplier - deficit.
 * - Exercise adjusted mode: returns `dailyCalorieTarget` (per-day adjustment at consumption sites).
 *   Returns null if biometrics are insufficient or activity level not set.
 */
export function getEffectiveDailyTarget(settings: UserSettings): number | null {
  if (!settings.calorieTargetEnabled) return null;

  if (settings.calorieTargetMode === 'static') {
    return settings.dailyCalorieTarget;
  }

  if (settings.calorieTargetMode === 'exercise_adjusted') {
    return settings.dailyCalorieTarget;
  }

  // body_stats mode
  if (!settings.activityLevel) return null;

  const bmr = computeAbsoluteBMR(settings);
  if (bmr == null) return null;

  // 'logged' activity level: use sedentary baseline (BMR × 1.2) - deficit
  // Actual logged exercise burns are added on top downstream.
  if (settings.activityLevel === 'logged') {
    const deficit = settings.dailyDeficit ?? 0;
    const sedentaryTdee = bmr * ACTIVITY_MULTIPLIERS.sedentary;
    const target = Math.round(sedentaryTdee - deficit);
    return target > 0 ? target : null;
  }

  const tdee = computeTDEE(bmr, settings.activityLevel);
  const deficit = settings.dailyDeficit ?? 0;
  const target = Math.round(tdee - deficit);
  return target > 0 ? target : null;
}

// ---------------------------------------------------------------------------
// Exercise-adjusted target helper
// ---------------------------------------------------------------------------

/**
 * Computes the exercise-adjusted target for a specific day.
 * @param base The user's base goal (dailyCalorieTarget)
 * @param dailyBurn Midpoint of estimated calorie burn for that day
 */
export function getExerciseAdjustedTarget(base: number, dailyBurn: number): number {
  return Math.round(base + dailyBurn);
}

// ---------------------------------------------------------------------------
// Activity level suggestion from logged exercise burn
// ---------------------------------------------------------------------------

/**
 * Maps an average daily exercise calorie burn to the closest activity tier.
 */
export function suggestActivityLevel(avgDailyBurn: number): MultiplierActivityLevel {
  if (avgDailyBurn < 100) return 'sedentary';
  if (avgDailyBurn < 250) return 'light';
  if (avgDailyBurn < 450) return 'moderate';
  return 'active';
}

// ---------------------------------------------------------------------------
// Helper: does this config use actual logged exercise burns?
// ---------------------------------------------------------------------------

/**
 * Returns true when the effective daily target should have actual logged
 * exercise burns added on top (varies per day).
 */
export function usesActualExerciseBurns(settings: UserSettings): boolean {
  return settings.calorieTargetMode === 'exercise_adjusted' ||
    (settings.calorieTargetMode === 'body_stats' && settings.activityLevel === 'logged');
}

// ---------------------------------------------------------------------------
// Rollup dot color (stricter thresholds for rolling averages)
// ---------------------------------------------------------------------------

/**
 * Like getTargetDotColor but with tighter thresholds for multi-day averages.
 * Green only when at or under target (no 2.5% buffer).
 */
export function getRollupDotColor(avgCalories: number, avgTarget: number): string {
  const overPercent = ((avgCalories - avgTarget) / avgTarget) * 100;
  if (overPercent <= 0) return "text-green-500 dark:text-green-400";
  if (overPercent <= 5) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

// ---------------------------------------------------------------------------
// Rolling calorie rollup computation
// ---------------------------------------------------------------------------

export interface RollupResult {
  avgIntake: number;
  dotColor: string;
  dayCount: number;
}

/**
 * Computes average daily intake vs average daily target over a rolling window.
 * Excludes today (incomplete) and days with no food entries.
 * Returns null if fewer than 2 eligible days.
 */
export function computeCalorieRollup(
  foodTotals: { date: string; totalCalories: number }[],
  windowDays: number,
  baseTarget: number,
  usesBurns: boolean,
  burnByDate: Map<string, number>,
): RollupResult | null {
  const today = format(new Date(), 'yyyy-MM-dd');
  const cutoff = format(subDays(new Date(), windowDays), 'yyyy-MM-dd');

  const eligible = foodTotals.filter(
    d => d.date >= cutoff && d.date < today
  );

  if (eligible.length < 2) return null;

  let totalIntake = 0;
  let totalTarget = 0;

  for (const day of eligible) {
    totalIntake += day.totalCalories;
    const dayTarget = usesBurns
      ? getExerciseAdjustedTarget(baseTarget, burnByDate.get(day.date) ?? 0)
      : baseTarget;
    totalTarget += dayTarget;
  }

  const avgIntake = Math.round(totalIntake / eligible.length);
  const avgTarget = totalTarget / eligible.length;

  return {
    avgIntake,
    dotColor: getRollupDotColor(avgIntake, avgTarget),
    dayCount: eligible.length,
  };
}

import { computeAbsoluteBMR } from './calorie-burn';
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

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
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

export function computeTDEE(bmr: number, activityLevel: ActivityLevel): number {
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
export function suggestActivityLevel(avgDailyBurn: number): ActivityLevel {
  if (avgDailyBurn < 100) return 'sedentary';
  if (avgDailyBurn < 250) return 'light';
  if (avgDailyBurn < 450) return 'moderate';
  return 'active';
}

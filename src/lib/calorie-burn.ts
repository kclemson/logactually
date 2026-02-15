/**
 * Calorie burn estimation for exercises.
 *
 * MET values sourced from the 2024 Compendium of Physical Activities
 * (Arizona State University): https://pacompendium.com/
 *
 * Formula: calories = MET × weight_kg × duration_hours × composition_multiplier
 */

import { isCardioExercise } from '@/lib/exercise-metadata';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CalorieBurnSettings {
  calorieBurnEnabled: boolean;
  bodyWeightLbs: number | null;
  heightInches: number | null;
  age: number | null;
  bodyComposition: 'female' | 'male' | null; // null = population average
  defaultIntensity: number | null; // 1-10
}

export interface ExerciseInput {
  exercise_key: string;
  exercise_subtype?: string | null;
  sets: number;
  reps: number;
  weight_lbs: number;
  duration_minutes?: number | null;
  distance_miles?: number | null;
  exercise_metadata?: Record<string, number> | null;
}

export type CalorieBurnResult =
  | { type: 'range'; low: number; high: number }
  | { type: 'exact'; value: number };

// ---------------------------------------------------------------------------
// MET lookup table
// ---------------------------------------------------------------------------

interface MetRange {
  low: number;
  high: number;
}

/**
 * MET ranges keyed by exercise_key, with optional subtype overrides.
 * A key with subtypes maps `_default` for when no subtype is provided.
 */
const MET_TABLE: Record<string, MetRange | Record<string, MetRange>> = {
  // Cardio
  walk_run: {
    walking: { low: 2.0, high: 3.5 },
    running: { low: 8.0, high: 12.0 },
    hiking: { low: 5.0, high: 8.0 },
    _default: { low: 2.0, high: 12.0 }, // wide when subtype unknown
  },
  cycling: {
    indoor: { low: 4.0, high: 8.5 },
    outdoor: { low: 4.0, high: 10.0 },
    _default: { low: 4.0, high: 10.0 },
  },
  swimming: {
    pool: { low: 6.0, high: 10.0 },
    open_water: { low: 6.0, high: 10.0 },
    _default: { low: 6.0, high: 10.0 },
  },
  rowing: { low: 4.0, high: 8.0 },
  elliptical: { low: 5.0, high: 8.0 },
  stair_climber: { low: 6.0, high: 9.0 },
  jump_rope: { low: 8.0, high: 12.0 },

  // Strength
  bench_press: { low: 3.5, high: 5.0 },
  incline_bench_press: { low: 3.5, high: 5.0 },
  decline_bench_press: { low: 3.5, high: 5.0 },
  dumbbell_press: { low: 3.5, high: 5.0 },
  chest_fly: { low: 3.0, high: 4.5 },
  shoulder_press: { low: 3.5, high: 5.0 },
  lateral_raise: { low: 3.0, high: 4.0 },
  front_raise: { low: 3.0, high: 4.0 },
  tricep_pushdown: { low: 3.0, high: 4.5 },
  tricep_extension: { low: 3.0, high: 4.5 },
  dips: { low: 3.5, high: 5.5 },
  lat_pulldown: { low: 3.5, high: 5.0 },
  pull_up: { low: 3.5, high: 5.5 },
  seated_row: { low: 3.5, high: 5.0 },
  bent_over_row: { low: 3.5, high: 5.0 },
  dumbbell_row: { low: 3.5, high: 5.0 },
  t_bar_row: { low: 3.5, high: 5.0 },
  face_pull: { low: 3.0, high: 4.0 },
  rear_delt_fly: { low: 3.0, high: 4.0 },
  bicep_curl: { low: 3.0, high: 4.5 },
  hammer_curl: { low: 3.0, high: 4.5 },
  preacher_curl: { low: 3.0, high: 4.5 },
  cable_curl: { low: 3.0, high: 4.5 },
  squat: { low: 5.0, high: 6.0 },
  front_squat: { low: 5.0, high: 6.0 },
  goblet_squat: { low: 4.5, high: 5.5 },
  leg_press: { low: 4.5, high: 5.5 },
  hack_squat: { low: 4.5, high: 5.5 },
  leg_extension: { low: 3.0, high: 4.5 },
  leg_curl: { low: 3.0, high: 4.5 },
  seated_leg_curl: { low: 3.0, high: 4.5 },
  romanian_deadlift: { low: 5.0, high: 6.0 },
  hip_thrust: { low: 4.0, high: 5.5 },
  calf_raise: { low: 3.0, high: 4.0 },
  seated_calf_raise: { low: 3.0, high: 4.0 },
  lunge: { low: 4.5, high: 6.0 },
  bulgarian_split_squat: { low: 4.5, high: 6.0 },
  step_up: { low: 4.5, high: 6.0 },
  deadlift: { low: 5.0, high: 6.0 },
  sumo_deadlift: { low: 5.0, high: 6.0 },
  trap_bar_deadlift: { low: 5.0, high: 6.0 },
  clean: { low: 5.0, high: 7.0 },
  snatch: { low: 5.0, high: 7.0 },
  kettlebell_swing: { low: 5.0, high: 7.0 },
  cable_crunch: { low: 3.0, high: 4.0 },
  hanging_leg_raise: { low: 3.0, high: 4.5 },
  ab_wheel: { low: 3.5, high: 5.0 },
  plank: { low: 3.0, high: 4.0 },
  russian_twist: { low: 3.0, high: 4.0 },
  sit_up: { low: 3.0, high: 4.0 },
  crunch: { low: 3.0, high: 4.0 },
  functional_strength: { low: 3.5, high: 6.0 },
};

const GENERIC_STRENGTH: MetRange = { low: 3.0, high: 6.0 };
const GENERIC_CARDIO: MetRange = { low: 4.0, high: 8.0 };

// Population weight range when user hasn't set body weight (in lbs)
const DEFAULT_WEIGHT_LOW_LBS = 130;
const DEFAULT_WEIGHT_HIGH_LBS = 190;

// Seconds per set (including rest) for strength duration estimation
const SECONDS_PER_SET_LOW = 35;
const SECONDS_PER_SET_HIGH = 45;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getMetRange(exerciseKey: string, subtype?: string | null): MetRange {
  const entry = MET_TABLE[exerciseKey];
  if (!entry) {
    // Fallback based on whether exercise is cardio
    return isCardioExercise(exerciseKey) ? GENERIC_CARDIO : GENERIC_STRENGTH;
  }

  // Simple range (no subtypes)
  if ('low' in entry && 'high' in entry) {
    return entry as MetRange;
  }

  // Has subtypes
  const subtypeMap = entry as Record<string, MetRange>;
  if (subtype && subtypeMap[subtype]) {
    return subtypeMap[subtype];
  }
  return subtypeMap._default || GENERIC_STRENGTH;
}

/**
 * Narrow the MET range based on effort (1-10).
 * Returns a narrowed { low, high } where both converge toward the interpolated point.
 */
export function narrowMetByEffort(met: MetRange, effort: number): MetRange {
  const clamped = Math.max(1, Math.min(10, effort));
  // Map 1-10 to 0-1
  const t = (clamped - 1) / 9;
  const point = met.low + t * (met.high - met.low);
  // Narrow to ±10% of the range around the point
  const margin = (met.high - met.low) * 0.1;
  return {
    low: Math.max(met.low, point - margin),
    high: Math.min(met.high, point + margin),
  };
}

/**
 * Add MET bonus for incline.
 * ~0.5-1.0 MET per 5% incline.
 */
export function applyInclineBonus(met: MetRange, inclinePct: number): MetRange {
  const bonus = (inclinePct / 5) * 0.75; // ~0.75 MET per 5% incline
  return {
    low: met.low + bonus,
    high: met.high + bonus,
  };
}

/**
 * Estimate duration in hours for strength exercises based on sets and reps.
 */
export function estimateStrengthDuration(sets: number, reps: number): { low: number; high: number } {
  const totalSets = sets; // sets is already total sets
  const lowSeconds = totalSets * SECONDS_PER_SET_LOW;
  const highSeconds = totalSets * SECONDS_PER_SET_HIGH;
  return {
    low: lowSeconds / 3600,
    high: highSeconds / 3600,
  };
}

/**
 * Get body composition multiplier.
 */
export function getCompositionMultiplier(composition: 'female' | 'male' | null): number {
  if (composition === 'female') return 0.95;
  if (composition === 'male') return 1.05;
  return 1.0;
}

/**
 * Convert height from cm to inches.
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Convert height from inches to cm.
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

// ---------------------------------------------------------------------------
// BMR-aware metabolic scaling
// ---------------------------------------------------------------------------

// Reference person: 170cm, 30 years old
const REFERENCE_HEIGHT_CM = 170;
const REFERENCE_AGE = 30;

// Mifflin-St Jeor helpers (shared between scaling factor and absolute BMR)
const maleBMR = (w: number, h: number, a: number) => 10 * w + 6.25 * h - 5 * a - 5;
const femaleBMR = (w: number, h: number, a: number) => 10 * w + 6.25 * h - 5 * a - 161;

/**
 * Compute the absolute BMR (kcal/day) using the Mifflin-St Jeor equation.
 * Returns null if body weight is missing (minimum required field).
 * When height or age are missing, population-average defaults are used.
 */
export function computeAbsoluteBMR(settings: {
  bodyWeightLbs: number | null;
  heightInches: number | null;
  age: number | null;
  bodyComposition: 'female' | 'male' | null;
}): number | null {
  if (settings.bodyWeightLbs == null || settings.bodyWeightLbs <= 0) return null;

  const weightKg = settings.bodyWeightLbs * 0.453592;
  const heightCm = settings.heightInches != null ? settings.heightInches * 2.54 : REFERENCE_HEIGHT_CM;
  const age = settings.age ?? REFERENCE_AGE;

  if (settings.bodyComposition === 'male') return maleBMR(weightKg, heightCm, age);
  if (settings.bodyComposition === 'female') return femaleBMR(weightKg, heightCm, age);
  // Population average: midpoint of male and female
  return (maleBMR(weightKg, heightCm, age) + femaleBMR(weightKg, heightCm, age)) / 2;
}

/**
 * Compute a BMR scaling factor using the Mifflin-St Jeor equation.
 * Returns `userBMR / referenceBMR` so calories scale up/down based on
 * how the user's metabolism differs from a "typical" person of the same weight.
 *
 * Returns 1.0 when height or age is missing (no adjustment possible).
 */
export function getBmrScalingFactor(settings: CalorieBurnSettings): number {
  const heightInches = settings.heightInches;
  const age = settings.age;

  // If neither height nor age is provided, no adjustment is possible
  // (weight cancels out in the ratio)
  if (heightInches == null && age == null) {
    return 1.0;
  }

  // Use actual weight or population midpoint (weight mostly cancels
  // in the ratio, but is needed for the equation)
  const weightKg = (settings.bodyWeightLbs ?? 160) * 0.453592;
  const heightCm = heightInches != null ? heightInches * 2.54 : REFERENCE_HEIGHT_CM;
  const userAge = age ?? REFERENCE_AGE;

  let userBmr: number;
  let refBmr: number;

  if (settings.bodyComposition === 'male') {
    userBmr = maleBMR(weightKg, heightCm, userAge);
    refBmr = maleBMR(weightKg, REFERENCE_HEIGHT_CM, REFERENCE_AGE);
  } else if (settings.bodyComposition === 'female') {
    userBmr = femaleBMR(weightKg, heightCm, userAge);
    refBmr = femaleBMR(weightKg, REFERENCE_HEIGHT_CM, REFERENCE_AGE);
  } else {
    // Population average: midpoint of male and female
    userBmr = (maleBMR(weightKg, heightCm, userAge) + femaleBMR(weightKg, heightCm, userAge)) / 2;
    refBmr = (maleBMR(weightKg, REFERENCE_HEIGHT_CM, REFERENCE_AGE) + femaleBMR(weightKg, REFERENCE_HEIGHT_CM, REFERENCE_AGE)) / 2;
  }

  // Guard against division by zero or negative BMR
  if (refBmr <= 0 || userBmr <= 0) return 1.0;

  return userBmr / refBmr;
}

// ---------------------------------------------------------------------------
// Main estimation function
// ---------------------------------------------------------------------------

export function estimateCalorieBurn(
  exercise: ExerciseInput,
  settings: CalorieBurnSettings,
): CalorieBurnResult {
  // 1. If user-reported calories exist, use them directly
  const reported = exercise.exercise_metadata?.calories_burned;
  if (reported != null && reported > 0) {
    return { type: 'exact', value: Math.round(reported) };
  }

  // 2. Get MET range
  let met = getMetRange(exercise.exercise_key, exercise.exercise_subtype);

  // 3. Apply effort narrowing
  const effort = exercise.exercise_metadata?.effort ?? null;
  const effectiveEffort = effort ?? settings.defaultIntensity;
  if (effectiveEffort != null) {
    met = narrowMetByEffort(met, effectiveEffort);
  }

  // 4. Apply incline bonus
  const incline = exercise.exercise_metadata?.incline_pct;
  if (incline != null && incline > 0) {
    met = applyInclineBonus(met, incline);
  }

  // 5. Determine duration (in hours)
  let durationLow: number;
  let durationHigh: number;
  const isCardio = isCardioExercise(exercise.exercise_key);

  if (exercise.duration_minutes != null && exercise.duration_minutes > 0) {
    const hours = exercise.duration_minutes / 60;
    durationLow = hours;
    durationHigh = hours;
  } else if (!isCardio && exercise.sets > 0) {
    const est = estimateStrengthDuration(exercise.sets, exercise.reps);
    durationLow = est.low;
    durationHigh = est.high;
  } else {
    return { type: 'range', low: 0, high: 0 };
  }

  // 6. Determine body weight (in kg)
  let weightKgLow: number;
  let weightKgHigh: number;
  if (settings.bodyWeightLbs != null && settings.bodyWeightLbs > 0) {
    const kg = settings.bodyWeightLbs * 0.453592;
    weightKgLow = kg;
    weightKgHigh = kg;
  } else {
    weightKgLow = DEFAULT_WEIGHT_LOW_LBS * 0.453592;
    weightKgHigh = DEFAULT_WEIGHT_HIGH_LBS * 0.453592;
  }

  // 7. Composition multiplier
  const comp = getCompositionMultiplier(settings.bodyComposition);

  // 8. BMR metabolic scaling (age + height aware)
  const bmrScale = getBmrScalingFactor(settings);

  // 9. Calculate
  const low = Math.round(met.low * weightKgLow * durationLow * comp * bmrScale);
  const high = Math.round(met.high * weightKgHigh * durationHigh * comp * bmrScale);

  return { type: 'range', low, high };
}

// ---------------------------------------------------------------------------
// Aggregate multiple exercises
// ---------------------------------------------------------------------------

export function estimateTotalCalorieBurn(
  exercises: ExerciseInput[],
  settings: CalorieBurnSettings,
): CalorieBurnResult {
  let totalLow = 0;
  let totalHigh = 0;
  let hasExact = false;
  let allExact = true;

  for (const ex of exercises) {
    const result = estimateCalorieBurn(ex, settings);
    if (result.type === 'exact') {
      totalLow += result.value;
      totalHigh += result.value;
      hasExact = true;
    } else {
      totalLow += result.low;
      totalHigh += result.high;
      if (result.low > 0 || result.high > 0) {
        allExact = false;
      }
    }
  }

  if (hasExact && allExact) {
    return { type: 'exact', value: totalLow };
  }
  return { type: 'range', low: totalLow, high: totalHigh };
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function formatCalorieBurnValue(result: CalorieBurnResult): string {
  if (result.type === 'exact') return `~${result.value}`;
  if (result.low === 0 && result.high === 0) return '';
  if (result.low === result.high) return `~${result.low}`;
  return `~${result.low}-${result.high}`;
}


/**
 * Format total inches as feet'inches" string, e.g. 61 -> 5'1"
 */
export function formatInchesAsFeetInches(totalInches: number): string {
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

/**
 * Build a short inline summary of the user's configured biometric stats.
 * Returns null if no biometric fields are set (signals: hide the checkbox).
 * e.g. "150 lbs, 5'1\", 48 years old, male"
 */
export function formatProfileStatsSummary(settings: {
  bodyWeightLbs?: number | null;
  heightInches?: number | null;
  heightUnit?: 'ft' | 'cm';
  age?: number | null;
  bodyComposition?: 'female' | 'male' | null;
}): string | null {
  const parts: string[] = [];

  if (settings.bodyWeightLbs != null) {
    parts.push(`${settings.bodyWeightLbs} lbs`);
  }
  if (settings.heightInches != null) {
    if (settings.heightUnit === 'cm') {
      parts.push(`${Math.round(settings.heightInches * 2.54)} cm`);
    } else {
      parts.push(formatInchesAsFeetInches(settings.heightInches));
    }
  }
  if (settings.age != null) {
    parts.push(`${settings.age} years old`);
  }
  if (settings.bodyComposition != null) {
    parts.push(settings.bodyComposition);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

export function formatCalorieBurnSettingsSummary(settings: CalorieBurnSettings): string {
  if (!settings.calorieBurnEnabled) return '';

  const parts: string[] = [];
  if (settings.bodyWeightLbs) {
    parts.push(`${settings.bodyWeightLbs} lbs`);
  }
  if (settings.defaultIntensity) {
    if (settings.defaultIntensity <= 3) parts.push('light');
    else if (settings.defaultIntensity <= 6) parts.push('moderate');
    else parts.push('intense');
  }
  if (settings.bodyComposition) {
    parts.push(settings.bodyComposition);
  }

  return parts.length > 0 ? parts.join(', ') : 'Configured';
}

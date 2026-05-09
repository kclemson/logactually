import type { SavedRoutine, SavedExerciseSet } from '@/types/weight';
import {
  type WeightUnit,
  type DistanceUnit,
  formatWeight,
  convertDistance,
  getWeightUnitLabel,
  getDistanceUnitLabel,
} from '@/lib/weight-units';

interface FormatOpts {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

const isCardioSet = (s: SavedExerciseSet): boolean =>
  Number(s.duration_minutes ?? 0) > 0 && Number(s.weight_lbs ?? 0) <= 0;

/**
 * A routine is cardio iff every set is cardio. Otherwise we treat it as lifting
 * (mixed routines fall back to lifting since strength is usually the headline).
 */
function isCardioRoutine(sets: SavedExerciseSet[]): boolean {
  if (sets.length === 0) return false;
  return sets.every(isCardioSet);
}

/**
 * Build a compact subtitle for a saved routine in the typeahead dropdown.
 *
 * Lifting, single  → "3×8 · 135 lb"
 * Lifting, multi   → "4 lifts · 12 sets"
 * Cardio,  single  → "30 min · 3.0 mi" (drops distance if missing)
 * Cardio,  multi   → "2 cardio · 45 min"
 */
export function formatRoutineSubtitle(
  routine: SavedRoutine,
  opts: FormatOpts,
): string {
  const sets = routine.exercise_sets ?? [];
  if (sets.length === 0) return '';

  const cardio = isCardioRoutine(sets);
  const weightLabel = getWeightUnitLabel(opts.weightUnit).toLowerCase();
  const distLabel = getDistanceUnitLabel(opts.distanceUnit).toLowerCase();

  if (!cardio) {
    if (sets.length === 1) {
      const s = sets[0];
      const reps = Number(s.reps ?? 0);
      const setCount = Number(s.sets ?? 0);
      const weight = Number(s.weight_lbs ?? 0);
      const left = setCount > 0 && reps > 0 ? `${setCount}×${reps}` : null;
      const right = weight > 0
        ? `${formatWeight(weight, opts.weightUnit, 0)} ${weightLabel}`
        : null;
      return [left, right].filter(Boolean).join(' · ');
    }
    const totalSets = sets.reduce((acc, s) => acc + Number(s.sets ?? 0), 0);
    return `${sets.length} lifts · ${totalSets} sets`;
  }

  // Cardio
  if (sets.length === 1) {
    const s = sets[0];
    const mins = Number(s.duration_minutes ?? 0);
    const distMi = Number(s.distance_miles ?? 0);
    const left = mins > 0 ? `${Math.round(mins)} min` : null;
    const right = distMi > 0
      ? `${convertDistance(distMi, 'mi', opts.distanceUnit).toFixed(1)} ${distLabel}`
      : null;
    return [left, right].filter(Boolean).join(' · ');
  }
  const totalMin = sets.reduce((acc, s) => acc + Number(s.duration_minutes ?? 0), 0);
  return `${sets.length} cardio · ${Math.round(totalMin)} min`;
}

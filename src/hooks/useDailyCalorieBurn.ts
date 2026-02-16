import { useMemo } from 'react';
import { useWeightTrends } from '@/hooks/useWeightTrends';
import { useUserSettings } from '@/hooks/useUserSettings';
import {
  estimateCalorieBurn,
  type CalorieBurnSettings,
  type ExerciseInput,
} from '@/lib/calorie-burn';
import { isCardioExercise } from '@/lib/exercise-metadata';

export interface DailyCalorieBurn {
  date: string;
  low: number;
  high: number;
  exerciseCount: number;
  cardioCount: number;
  strengthCount: number;
}

export function useDailyCalorieBurn(days: number, options?: { force?: boolean }) {
  const { data: exercises = [], isLoading: trendsLoading } = useWeightTrends(days);
  const { settings, isLoading: settingsLoading } = useUserSettings();

  const data = useMemo((): DailyCalorieBurn[] => {
    if (!settings.calorieBurnEnabled && !options?.force) return [];

    const burnSettings: CalorieBurnSettings = {
      calorieBurnEnabled: settings.calorieBurnEnabled,
      bodyWeightLbs: settings.bodyWeightLbs,
      heightInches: settings.heightInches,
      age: settings.age,
      bodyComposition: settings.bodyComposition,
      defaultIntensity: settings.defaultIntensity,
    };

    // Aggregate low/high per day across all exercises
    const byDate: Record<string, { low: number; high: number }> = {};
    const exercisesByDate: Record<string, Set<string>> = {};

    for (const exercise of exercises) {
      for (const point of exercise.weightData) {
        const input: ExerciseInput = {
          exercise_key: exercise.exercise_key,
          exercise_subtype: exercise.exercise_subtype,
          sets: point.sets,
          reps: point.reps,
          weight_lbs: point.weight,
          duration_minutes: point.duration_minutes,
          distance_miles: point.distance_miles,
          exercise_metadata: point.exercise_metadata,
        };

        const result = estimateCalorieBurn(input, burnSettings);

        if (!byDate[point.date]) {
          byDate[point.date] = { low: 0, high: 0 };
          exercisesByDate[point.date] = new Set();
        }

        exercisesByDate[point.date].add(exercise.exercise_key);

        if (result.type === 'exact') {
          byDate[point.date].low += result.value;
          byDate[point.date].high += result.value;
        } else {
          byDate[point.date].low += result.low;
          byDate[point.date].high += result.high;
        }
      }
    }

    // Filter out days with 0 burn and sort by date
    return Object.entries(byDate)
      .filter(([_, v]) => v.low > 0 || v.high > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, totals]) => {
        const keys = exercisesByDate[date] || new Set();
        let cardioCount = 0;
        let strengthCount = 0;
        keys.forEach(k => {
          if (isCardioExercise(k)) cardioCount++;
          else strengthCount++;
        });
        return {
          date,
          low: totals.low,
          high: totals.high,
          exerciseCount: keys.size,
          cardioCount,
          strengthCount,
        };
      });
  }, [exercises, settings]);

  return {
    data,
    isLoading: trendsLoading || settingsLoading,
  };
}

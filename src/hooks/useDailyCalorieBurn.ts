import { useMemo } from 'react';
import { useWeightTrends } from '@/hooks/useWeightTrends';
import { useUserSettings } from '@/hooks/useUserSettings';
import {
  estimateCalorieBurn,
  type CalorieBurnSettings,
  type ExerciseInput,
} from '@/lib/calorie-burn';

export interface DailyCalorieBurn {
  date: string;
  low: number;
  high: number;
}

export function useDailyCalorieBurn(days: number) {
  const { data: exercises = [], isLoading: trendsLoading } = useWeightTrends(days);
  const { settings, isLoading: settingsLoading } = useUserSettings();

  const data = useMemo((): DailyCalorieBurn[] => {
    if (!settings.calorieBurnEnabled) return [];

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
        }

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
      .map(([date, totals]) => ({
        date,
        low: totals.low,
        high: totals.high,
      }));
  }, [exercises, settings]);

  return {
    data,
    isLoading: trendsLoading || settingsLoading,
  };
}

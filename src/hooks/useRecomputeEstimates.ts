import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { estimateCalorieBurn, type CalorieBurnSettings, type ExerciseInput } from '@/lib/calorie-burn';
import { logger } from '@/lib/logger';

/**
 * Compute the midpoint estimate from a CalorieBurnResult.
 * Returns null only for zero-range results (cardio with no duration).
 */
export function computeEstimateMidpoint(exercise: ExerciseInput, settings: CalorieBurnSettings): number | null {
  const result = estimateCalorieBurn(exercise, settings);
  if (result.type === 'exact') return result.value;
  if (result.low + result.high > 0) return Math.round((result.low + result.high) / 2);
  return null;
}

const BATCH_SIZE = 100;
const PAGE_SIZE = 1000;

const SELECT_COLUMNS = 'id, exercise_key, exercise_subtype, sets, reps, weight_lbs, duration_minutes, distance_miles, calories_burned_override, effort, heart_rate, incline_pct, cadence_rpm, speed_mph, exercise_metadata' as const;

/**
 * Hook that exposes a function to recompute calories_burned_estimate
 * for ALL of a user's weight_sets rows using the given CalorieBurnSettings.
 */
export function useRecomputeEstimates() {
  const { user } = useAuth();
  const isRunning = useRef(false);

  const recompute = useCallback(async (settings: CalorieBurnSettings) => {
    if (!user || isRunning.current) return;
    isRunning.current = true;

    try {
      // Fetch all rows with pagination
      let allRows: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('weight_sets')
          .select(SELECT_COLUMNS)
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          logger.error('Failed to fetch weight_sets for recompute:', error);
          return;
        }

        allRows = allRows.concat(data ?? []);
        hasMore = (data?.length ?? 0) === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      if (allRows.length === 0) return;

      // Compute new estimates
      const updates: { id: string; estimate: number | null }[] = allRows.map((row: any) => {
        const exercise: ExerciseInput = {
          exercise_key: row.exercise_key,
          exercise_subtype: row.exercise_subtype,
          sets: row.sets,
          reps: row.reps,
          weight_lbs: Number(row.weight_lbs),
          duration_minutes: row.duration_minutes,
          distance_miles: row.distance_miles,
          calories_burned_override: row.calories_burned_override,
          effort: row.effort,
          heart_rate: row.heart_rate,
          incline_pct: row.incline_pct,
          cadence_rpm: row.cadence_rpm,
          speed_mph: row.speed_mph,
          exercise_metadata: row.exercise_metadata as Record<string, number> | null,
        };
        return { id: row.id, estimate: computeEstimateMidpoint(exercise, settings) };
      });

      // Batch update
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(({ id, estimate }) =>
            supabase
              .from('weight_sets')
              .update({ calories_burned_estimate: estimate })
              .eq('id', id)
          )
        );
      }

      logger.log(`Recomputed calorie estimates for ${updates.length} rows`);
    } catch (err) {
      logger.error('Recompute estimates failed:', err);
    } finally {
      isRunning.current = false;
    }
  }, [user]);

  return { recompute };
}

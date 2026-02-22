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

      // Compute new estimates and group by value for efficient batch updates
      const groups = new Map<number | 'null', string[]>();
      for (const row of allRows) {
        const exercise: ExerciseInput = {
          exercise_key: row.exercise_key,
          exercise_subtype: row.exercise_subtype,
          sets: Number(row.sets),
          reps: Number(row.reps),
          weight_lbs: Number(row.weight_lbs),
          duration_minutes: row.duration_minutes != null ? Number(row.duration_minutes) : undefined,
          distance_miles: row.distance_miles != null ? Number(row.distance_miles) : undefined,
          calories_burned_override: row.calories_burned_override != null ? Number(row.calories_burned_override) : undefined,
          effort: row.effort != null ? Number(row.effort) : undefined,
          heart_rate: row.heart_rate != null ? Number(row.heart_rate) : undefined,
          incline_pct: row.incline_pct != null ? Number(row.incline_pct) : undefined,
          cadence_rpm: row.cadence_rpm != null ? Number(row.cadence_rpm) : undefined,
          speed_mph: row.speed_mph != null ? Number(row.speed_mph) : undefined,
          exercise_metadata: row.exercise_metadata as Record<string, number> | null,
        };
        const estimate = computeEstimateMidpoint(exercise, settings);
        const key = estimate ?? 'null';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row.id);
      }

      // Batch update: one query per distinct estimate value
      let updatedCount = 0;
      let errorCount = 0;
      for (const [estimate, ids] of groups) {
        const value = estimate === 'null' ? null : estimate;
        // Supabase .in() supports up to ~1000 items; chunk if needed
        for (let i = 0; i < ids.length; i += PAGE_SIZE) {
          const chunk = ids.slice(i, i + PAGE_SIZE);
          const { error } = await supabase
            .from('weight_sets')
            .update({ calories_burned_estimate: value })
            .in('id', chunk);
          if (error) {
            logger.error(`Batch update failed for estimate=${value}, chunk size=${chunk.length}:`, error);
            errorCount += chunk.length;
          } else {
            updatedCount += chunk.length;
          }
        }
      }

      logger.log(`Recomputed calorie estimates: ${updatedCount} updated, ${errorCount} failed, ${groups.size} distinct values`);
    } catch (err) {
      logger.error('Recompute estimates failed:', err);
    } finally {
      isRunning.current = false;
    }
  }, [user]);

  return { recompute };
}

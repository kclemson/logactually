import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WeightSet, WeightSetRow } from '@/types/weight';
import { type CalorieBurnSettings, type ExerciseInput } from '@/lib/calorie-burn';
import { computeEstimateMidpoint } from '@/hooks/useRecomputeEstimates';

/**
 * Hook for managing weight entries for a specific date.
 * Uses a normalized schema where each exercise set is its own row.
 * Accepts optional CalorieBurnSettings to compute calories_burned_estimate on write.
 */
export function useWeightEntries(date: string, calorieBurnSettings?: CalorieBurnSettings) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all weight sets for the given date
  const query = useQuery({
    queryKey: ['weight-sets', date, user?.id],
    queryFn: async (): Promise<WeightSet[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('weight_sets')
        .select('*')
        .eq('logged_date', date)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      // Transform database rows to UI format with UIDs
      return (data as WeightSetRow[]).map(row => ({
        id: row.id,
        uid: row.id, // Use database ID as UID for existing rows
        entryId: row.entry_id,
        exercise_key: row.exercise_key,
        exercise_subtype: row.exercise_subtype ?? null,
        description: row.description,
        sets: row.sets,
        reps: row.reps,
        weight_lbs: Number(row.weight_lbs),
        duration_minutes: row.duration_minutes ?? null,
        distance_miles: row.distance_miles ?? null,
        // Promoted metadata columns (column-first, JSONB fallback)
        calories_burned_override: row.calories_burned_override ?? (row.exercise_metadata as any)?.calories_burned ?? null,
        effort: row.effort ?? (row.exercise_metadata as any)?.effort ?? null,
        heart_rate: row.heart_rate ?? (row.exercise_metadata as any)?.heart_rate ?? null,
        incline_pct: row.incline_pct ?? (row.exercise_metadata as any)?.incline_pct ?? null,
        cadence_rpm: row.cadence_rpm ?? (row.exercise_metadata as any)?.cadence_rpm ?? null,
        speed_mph: row.speed_mph ?? (row.exercise_metadata as any)?.speed_mph ?? null,
        calories_burned_estimate: row.calories_burned_estimate ?? null,
        exercise_metadata: row.exercise_metadata ?? null,
        rawInput: row.raw_input,
        sourceRoutineId: row.source_routine_id,
        groupName: row.group_name,
        createdAt: row.created_at,
      }));
    },
    enabled: !!user,
  });

  // Create multiple weight sets with a shared entry_id
  const createEntry = useMutation({
    mutationFn: async (params: {
      entry_id: string;
      logged_date: string;
      raw_input: string | null;
      source_routine_id?: string | null;
      group_name?: string | null;
      weight_sets: Omit<WeightSet, 'id' | 'uid' | 'editedFields'>[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert all sets with the shared entry_id
      const rows = params.weight_sets.map((set, index) => {
        // Compute calorie burn estimate if settings provided
        let estimate: number | null = null;
        if (calorieBurnSettings) {
          const exerciseInput: ExerciseInput = {
            exercise_key: set.exercise_key,
            exercise_subtype: set.exercise_subtype,
            sets: set.sets,
            reps: set.reps,
            weight_lbs: set.weight_lbs,
            duration_minutes: set.duration_minutes,
            distance_miles: set.distance_miles,
            calories_burned_override: set.calories_burned_override,
            effort: set.effort,
            heart_rate: set.heart_rate,
            incline_pct: set.incline_pct,
            cadence_rpm: set.cadence_rpm,
            speed_mph: set.speed_mph,
            exercise_metadata: set.exercise_metadata as Record<string, number> | null,
          };
          estimate = computeEstimateMidpoint(exerciseInput, calorieBurnSettings);
        }

        return {
          user_id: user.id,
          entry_id: params.entry_id,
          logged_date: params.logged_date,
          exercise_key: set.exercise_key,
          exercise_subtype: set.exercise_subtype ?? null,
          description: set.description,
          sets: set.sets,
          reps: set.reps,
          weight_lbs: set.weight_lbs,
          duration_minutes: set.duration_minutes ?? null,
          distance_miles: set.distance_miles ?? null,
          // Promoted metadata columns
          calories_burned_override: set.calories_burned_override ?? (set.exercise_metadata as any)?.calories_burned ?? null,
          effort: set.effort ?? (set.exercise_metadata as any)?.effort ?? null,
          heart_rate: set.heart_rate ?? (set.exercise_metadata as any)?.heart_rate ?? null,
          incline_pct: set.incline_pct ?? (set.exercise_metadata as any)?.incline_pct ?? null,
          cadence_rpm: set.cadence_rpm ?? (set.exercise_metadata as any)?.cadence_rpm ?? null,
          speed_mph: set.speed_mph ?? (set.exercise_metadata as any)?.speed_mph ?? null,
          calories_burned_estimate: estimate,
          // Strip promoted keys from exercise_metadata, keep only unknown future keys
          exercise_metadata: (() => {
            if (!set.exercise_metadata) return null;
            const promoted = ['calories_burned', 'effort', 'heart_rate', 'incline_pct', 'cadence_rpm', 'speed_mph'];
            const remaining = Object.fromEntries(
              Object.entries(set.exercise_metadata).filter(([k]) => !promoted.includes(k))
            );
            return Object.keys(remaining).length > 0 ? remaining : null;
          })(),
          // Only store raw_input, source_routine_id, group_name on the first set
          raw_input: index === 0 ? params.raw_input : null,
          source_routine_id: index === 0 ? (params.source_routine_id ?? null) : null,
          group_name: index === 0 ? (params.group_name ?? null) : null,
        };
      });

      const { error } = await supabase.from('weight_sets').insert(rows);
      if (error) throw error;
    },
    // Caller handles invalidation to enable awaiting
  });

  // Fields that affect calorie burn estimate
  const ESTIMATE_AFFECTING_FIELDS = new Set([
    'sets', 'reps', 'weight_lbs', 'duration_minutes', 'distance_miles',
    'effort', 'incline_pct', 'calories_burned_override', 'exercise_key', 'exercise_subtype',
  ]);

  // Update a single weight set
  const updateSet = useMutation({
    mutationFn: async (params: {
      id: string;
      updates: Partial<Pick<WeightSet,
        'description' | 'sets' | 'reps' | 'weight_lbs' |
        'duration_minutes' | 'distance_miles' |
        'exercise_key' | 'exercise_subtype' | 'exercise_metadata' |
        'calories_burned_override' | 'effort' | 'heart_rate' |
        'incline_pct' | 'cadence_rpm' | 'speed_mph' | 'calories_burned_estimate'
      >>;
    }) => {
      // Map camelCase to snake_case for DB columns that differ
      const dbUpdates: Record<string, any> = {};
      // Promoted metadata column name mapping
      const PROMOTED_COLUMNS: Record<string, string> = {
        calories_burned_override: 'calories_burned_override',
        effort: 'effort',
        heart_rate: 'heart_rate',
        incline_pct: 'incline_pct',
        cadence_rpm: 'cadence_rpm',
        speed_mph: 'speed_mph',
        calories_burned_estimate: 'calories_burned_estimate',
      };
      for (const [key, value] of Object.entries(params.updates)) {
        if (PROMOTED_COLUMNS[key]) {
          dbUpdates[PROMOTED_COLUMNS[key]] = value;
        } else if (key === 'exercise_metadata') {
          dbUpdates.exercise_metadata = value;
        } else if (key === 'exercise_subtype') {
          dbUpdates.exercise_subtype = value;
        } else if (key === 'exercise_key') {
          dbUpdates.exercise_key = value;
        } else if (key === 'duration_minutes') {
          dbUpdates.duration_minutes = value;
        } else if (key === 'distance_miles') {
          dbUpdates.distance_miles = value;
        } else {
          dbUpdates[key] = value;
        }
      }

      // Recompute estimate if any affecting field changed and settings available
      const affectsEstimate = Object.keys(params.updates).some(k => ESTIMATE_AFFECTING_FIELDS.has(k));
      if (affectsEstimate && calorieBurnSettings) {
        // Fetch the current row to merge with updates
        const { data: currentRow } = await supabase
          .from('weight_sets')
          .select('exercise_key, exercise_subtype, sets, reps, weight_lbs, duration_minutes, distance_miles, calories_burned_override, effort, heart_rate, incline_pct, cadence_rpm, speed_mph, exercise_metadata')
          .eq('id', params.id)
          .single();

        if (currentRow) {
          const merged = { ...currentRow, ...params.updates };
          const exerciseInput: ExerciseInput = {
            exercise_key: merged.exercise_key,
            exercise_subtype: merged.exercise_subtype,
            sets: merged.sets,
            reps: merged.reps,
            weight_lbs: Number(merged.weight_lbs),
            duration_minutes: merged.duration_minutes,
            distance_miles: merged.distance_miles,
            calories_burned_override: merged.calories_burned_override,
            effort: merged.effort,
            heart_rate: merged.heart_rate,
            incline_pct: merged.incline_pct,
            cadence_rpm: merged.cadence_rpm,
            speed_mph: merged.speed_mph,
            exercise_metadata: merged.exercise_metadata as Record<string, number> | null,
          };
          dbUpdates.calories_burned_estimate = computeEstimateMidpoint(exerciseInput, calorieBurnSettings);
        }
      }

      const { error } = await supabase
        .from('weight_sets')
        .update(dbUpdates)
        .eq('id', params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    },
  });

  // Delete a single weight set
  const deleteSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weight_sets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    },
  });

  // Delete all weight sets for a specific entry
  const deleteEntry = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('weight_sets')
        .delete()
        .eq('entry_id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    },
  });

  // Delete all weight sets for the date
  const deleteAllByDate = useMutation({
    mutationFn: async (targetDate: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('weight_sets')
        .delete()
        .eq('logged_date', targetDate)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    },
  });

  // Update group_name on the first weight_set row for an entry
  const updateGroupName = useMutation({
    mutationFn: async (params: { entryId: string; groupName: string }) => {
      // Find the first row for this entry (by created_at order)
      const { data: rows, error: fetchError } = await supabase
        .from('weight_sets')
        .select('id')
        .eq('entry_id', params.entryId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!rows || rows.length === 0) throw new Error('No rows found for entry');

      const { error } = await supabase
        .from('weight_sets')
        .update({ group_name: params.groupName } as any)
        .eq('id', rows[0].id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    },
  });

  return {
    weightSets: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    createEntry,
    updateSet,
    deleteSet,
    deleteEntry,
    deleteAllByDate,
    updateGroupName,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WeightSet, WeightSetRow } from '@/types/weight';

/**
 * Hook for managing weight entries for a specific date.
 * Uses a normalized schema where each exercise set is its own row.
 */
export function useWeightEntries(date: string) {
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
        exercise_metadata: row.exercise_metadata ?? null,
        rawInput: row.raw_input,
        sourceRoutineId: row.source_routine_id,
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
      weight_sets: Omit<WeightSet, 'id' | 'uid' | 'editedFields'>[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Insert all sets with the shared entry_id
      const rows = params.weight_sets.map((set, index) => ({
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
        exercise_metadata: set.exercise_metadata ?? null,
        // Only store raw_input and source_routine_id on the first set
        raw_input: index === 0 ? params.raw_input : null,
        source_routine_id: index === 0 ? (params.source_routine_id ?? null) : null,
      }));

      const { error } = await supabase.from('weight_sets').insert(rows);
      if (error) throw error;
    },
    // Caller handles invalidation to enable awaiting
  });

  // Update a single weight set
  const updateSet = useMutation({
    mutationFn: async (params: {
      id: string;
      updates: Partial<Pick<WeightSet, 'description' | 'sets' | 'reps' | 'weight_lbs'>>;
    }) => {
      const { error } = await supabase
        .from('weight_sets')
        .update(params.updates)
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
  };
}

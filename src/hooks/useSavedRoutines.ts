import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SavedRoutine, SavedExerciseSet } from '@/types/weight';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

/**
 * Fetch all saved routines for the current user, sorted by usage.
 */
export function useSavedRoutines() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['saved-routines', user?.id],
    queryFn: async (): Promise<SavedRoutine[]> => {
      const { data, error } = await supabase
        .from('saved_routines')
        .select('*')
        .order('use_count', { ascending: false })
        .order('last_used_at', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      
      // Transform JSONB exercise_sets to typed array
      return (data ?? []).map(row => ({
        ...row,
        exercise_sets: (row.exercise_sets as unknown as SavedExerciseSet[]) ?? [],
      }));
    },
    enabled: !!user,
  });
}

interface SaveRoutineParams {
  name: string;
  originalInput: string | null;
  exerciseSets: SavedExerciseSet[];
}

/**
 * Create a new saved routine.
 */
export function useSaveRoutine() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ name, originalInput, exerciseSets }: SaveRoutineParams) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('saved_routines')
        .insert([{
          user_id: user.id,
          name,
          original_input: originalInput,
          exercise_sets: exerciseSets as unknown as Json,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routines'] });
    },
  });
}

interface UpdateSavedRoutineParams {
  id: string;
  name?: string;
  exerciseSets?: SavedExerciseSet[];
}

/**
 * Update an existing saved routine (name or exercise sets).
 */
export function useUpdateSavedRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, name, exerciseSets }: UpdateSavedRoutineParams) => {
      const updates: Record<string, unknown> = {};
      
      if (name !== undefined) {
        updates.name = name;
      }
      
      if (exerciseSets !== undefined) {
        // Strip runtime metadata before saving (in case any slipped through)
        const cleanedSets = exerciseSets.map(({ exercise_key, description, sets, reps, weight_lbs }) => ({
          exercise_key,
          description,
          sets,
          reps,
          weight_lbs,
        }));
        updates.exercise_sets = cleanedSets as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('saved_routines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routines'] });
    },
  });
}

/**
 * Delete a saved routine.
 */
export function useDeleteSavedRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_routines')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routines'] });
    },
  });
}

/**
 * Log a saved routine: increment use_count, update last_used_at, return exercise sets.
 */
export function useLogSavedRoutine() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<SavedExerciseSet[]> => {
      // First, get the routine to return its exercise sets
      const { data: routine, error: fetchError } = await supabase
        .from('saved_routines')
        .select('exercise_sets, use_count')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update use_count and last_used_at
      const { error: updateError } = await supabase
        .from('saved_routines')
        .update({
          use_count: (routine.use_count ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      return (routine.exercise_sets as unknown as SavedExerciseSet[]) ?? [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-routines'] });
    },
  });
}

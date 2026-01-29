import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMergeExercises() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ keepKey, mergeKeys }: { 
      keepKey: string; 
      mergeKeys: string[] 
    }) => {
      const { error } = await supabase
        .from('weight_sets')
        .update({ exercise_key: keepKey })
        .in('exercise_key', mergeKeys);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-trends'] });
    },
  });
}

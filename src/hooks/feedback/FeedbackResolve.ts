import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResolveFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, resolve }: { feedbackId: string; resolve: boolean }) => {
      const { error } = await supabase
        .from('feedback')
        .update({ resolved_at: resolve ? new Date().toISOString() : null } as any)
        .eq('id', feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
    },
  });
}

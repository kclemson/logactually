import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useResolveFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, resolve, reason }: { feedbackId: string; resolve: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('feedback')
        .update(resolve
          ? { resolved_at: new Date().toISOString(), resolved_reason: reason ?? null } as any
          : { resolved_at: null, resolved_reason: null } as any
        )
        .eq('id', feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRespondToFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, response }: { feedbackId: string; response: string }) => {
      const { error } = await supabase
        .from('feedback')
        .update({ 
          response, 
          responded_at: new Date().toISOString() 
        })
        .eq('id', feedbackId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
    },
  });
}

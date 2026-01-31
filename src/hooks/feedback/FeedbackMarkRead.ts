import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useMarkFeedbackRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('feedback')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .not('response', 'is', null)
        .is('read_at', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadResponses'] });
      queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
    },
  });
}

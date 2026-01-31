import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useSubmitFeedback() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('feedback')
        .insert({ user_id: user.id, message });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
    },
  });
}

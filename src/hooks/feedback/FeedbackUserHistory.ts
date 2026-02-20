import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { UserFeedback } from './FeedbackTypes';

export function useUserFeedback() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['userFeedback', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('feedback')
        .select('id, feedback_id, message, created_at, response, responded_at, read_at, resolved_at, resolved_reason, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as UserFeedback[];
    },
    enabled: !!user,
  });
}

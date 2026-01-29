import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    },
  });
}

interface FeedbackWithUser {
  id: string;
  message: string;
  created_at: string;
  user_number: number;
}

export function useAdminFeedback() {
  return useQuery({
    queryKey: ['adminFeedback'],
    queryFn: async () => {
      // Get feedback with user info via a join
      const { data, error } = await supabase
        .from('feedback')
        .select('id, message, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Get profiles to map user_id to user_number
      const userIds = [...new Set(data.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_number')
        .in('id', userIds);
      
      const userMap = new Map(profiles?.map(p => [p.id, p.user_number]) ?? []);
      
      return data.map(f => ({
        id: f.id,
        message: f.message,
        created_at: f.created_at,
        user_number: userMap.get(f.user_id) ?? 0,
      })) as FeedbackWithUser[];
    },
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useHasUnreadResponses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unreadResponses', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { count, error } = await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('response', 'is', null)
        .is('read_at', null);
      
      if (error) throw error;
      
      return (count ?? 0) > 0;
    },
    enabled: !!user,
  });
}

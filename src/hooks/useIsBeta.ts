import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useIsBeta() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['isBeta', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'beta' });
      if (error) return false;
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

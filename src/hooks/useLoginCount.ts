import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type UserFilter = 'demo' | 'all' | string;

export function useLoginCount(userFilter: UserFilter, timeframeHours: number | null) {
  return useQuery({
    queryKey: ['login-count', userFilter, timeframeHours],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_login_count' as never, {
        user_filter: userFilter,
        timeframe_hours: timeframeHours
      } as never);
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}

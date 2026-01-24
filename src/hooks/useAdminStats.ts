import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DailyStats {
  stat_date: string;
  entry_count: number;
  total_users: number;
  users_created: number;
}

interface UsageStats {
  total_users: number;
  total_entries: number;
  active_last_7_days: number;
  users_created_last_7_days: number;
  entries_created_last_7_days: number;
  daily_stats: DailyStats[];
}

export function useAdminStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<UsageStats> => {
      const { data, error } = await supabase.rpc('get_usage_stats', {
        exclude_user_id: user?.id,
      });
      if (error) throw error;
      return data as unknown as UsageStats;
    },
    enabled: !!user && import.meta.env.DEV,
  });
}

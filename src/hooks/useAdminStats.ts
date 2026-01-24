import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyStats {
  stat_date: string;
  entry_count: number;
  total_users: number;
  users_with_entries: number;
  users_created: number;
}

interface UsageStats {
  total_users: number;
  users_with_entries: number;
  total_entries: number;
  active_last_7_days: number;
  users_created_last_7_days: number;
  entries_created_last_7_days: number;
  daily_stats: DailyStats[];
}

interface UserStats {
  user_id: string;
  total_entries: number;
  entries_today: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<UsageStats> => {
      const { data, error } = await supabase.rpc('get_usage_stats');
      if (error) throw error;
      return data as unknown as UsageStats;
    },
    enabled: import.meta.env.DEV,
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async (): Promise<UserStats[]> => {
      const { data, error } = await supabase.rpc('get_user_stats');
      if (error) throw error;
      return (data as unknown as UserStats[]) ?? [];
    },
    enabled: import.meta.env.DEV,
  });
}

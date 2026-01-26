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
  // Saved meals metrics
  total_saved_meals: number;
  users_with_saved_meals: number;
  avg_saved_meals_per_user: number;
  saved_meals_used_last_7_days: number;
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
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error } = await supabase.rpc('get_usage_stats', {
        user_timezone: timezone
      });
      if (error) throw error;
      return data as unknown as UsageStats;
    },
    enabled: true,
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async (): Promise<UserStats[]> => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const { data, error } = await supabase.rpc('get_user_stats', {
        user_timezone: timezone
      });
      if (error) throw error;
      return (data as unknown as UserStats[]) ?? [];
    },
    enabled: true,
  });
}

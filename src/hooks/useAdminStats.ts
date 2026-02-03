import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DailyStats {
  stat_date: string;
  entry_count: number;
  weight_count: number;
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
  // Demo metrics
  demo_logins: number;
  // Saved meals metrics
  total_saved_meals: number;
  users_with_saved_meals: number;
  avg_saved_meals_per_user: number;
  saved_meals_used_last_7_days: number;
  // Saved routines metrics
  total_saved_routines: number;
}

interface TodayFoodDetail {
  raw_input: string | null;
  saved_meal_name: string | null;
  items: string[] | null;
}

interface TodayWeightDetail {
  raw_input: string | null;
  saved_routine_name: string | null;
  description: string;
}

interface UserStats {
  user_id: string;
  user_number: number;
  total_entries: number;
  entries_today: number;
  total_weight_entries: number;
  weight_today: number;
  saved_meals_count: number;
  saved_routines_count: number;
  last_active: string | null;
  login_count: number;
  food_today_details: TodayFoodDetail[] | null;
  weight_today_details: TodayWeightDetail[] | null;
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

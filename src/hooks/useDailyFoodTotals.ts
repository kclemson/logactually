import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subDays, format } from 'date-fns';

export interface DailyFoodTotal {
  date: string;
  totalCalories: number;
}

export function useDailyFoodTotals(days: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['daily-food-totals', user?.id, days],
    queryFn: async (): Promise<DailyFoodTotal[]> => {
      const cutoff = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('food_entries')
        .select('eaten_date, total_calories')
        .gte('eaten_date', cutoff);

      if (error) throw error;

      // Aggregate by date
      const byDate: Record<string, number> = {};
      for (const row of data ?? []) {
        byDate[row.eaten_date] = (byDate[row.eaten_date] ?? 0) + row.total_calories;
      }

      return Object.entries(byDate)
        .map(([date, totalCalories]) => ({ date, totalCalories }))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

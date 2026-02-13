import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export function useFoodDatesWithData(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthKey = format(monthStart, 'yyyy-MM');

  return useQuery({
    queryKey: ['food-dates', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('eaten_date')
        .gte('eaten_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('eaten_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      // Return unique dates as Date objects
      const dates = [...new Set(data?.map(e => e.eaten_date) ?? [])];
      // Use T12:00:00 to avoid timezone shift
      return dates.map(d => new Date(`${d}T12:00:00`));
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useWeightDatesWithData(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthKey = format(monthStart, 'yyyy-MM');

  return useQuery({
    queryKey: ['weight-dates', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_sets')
        .select('logged_date')
        .gte('logged_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('logged_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const dates = [...new Set(data?.map(e => e.logged_date) ?? [])];
      return dates.map(d => new Date(`${d}T12:00:00`));
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCustomLogDatesWithData(month: Date) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthKey = format(monthStart, 'yyyy-MM');

  return useQuery({
    queryKey: ['custom-log-dates', monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_log_entries')
        .select('logged_date')
        .gte('logged_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('logged_date', format(monthEnd, 'yyyy-MM-dd'));

      if (error) throw error;

      const dates = [...new Set(data?.map(e => e.logged_date) ?? [])];
      return dates.map(d => new Date(`${d}T12:00:00`));
    },
    staleTime: 1000 * 60 * 5,
  });
}

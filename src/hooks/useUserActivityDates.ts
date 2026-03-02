import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';

export function useUserActivityDates(userId: string | null) {
  return useQuery({
    queryKey: ['userActivityDates', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_activity_dates' as any, { target_user_id: userId });
      if (error) throw error;
      return (data as { activity_date: string }[]).map(r => r.activity_date);
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}

/** Group date strings by month, returning a compact display string */
export function formatActivityDates(dates: string[]): string {
  const grouped = new Map<string, number[]>();
  for (const d of dates) {
    const parsed = parseISO(d);
    const monthKey = format(parsed, 'MMM');
    const day = parsed.getDate();
    if (!grouped.has(monthKey)) grouped.set(monthKey, []);
    grouped.get(monthKey)!.push(day);
  }
  return Array.from(grouped.entries())
    .map(([month, days]) => `${month}: ${days.join(', ')}`)
    .join(' · ');
}

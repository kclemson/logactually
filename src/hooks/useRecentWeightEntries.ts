import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WeightEntryGrouped } from '@/lib/repeated-entry-detection';

/**
 * Fetch recent weight entries grouped by entry_id for pattern detection.
 * 
 * Filters by created_at (when logged) rather than logged_date (calendar date).
 * This ensures backdated entries are included in pattern detection,
 * optimizing for new user onboarding when they fill in historical data.
 * 
 * @param daysBack Number of days to look back (default: 90)
 */
export function useRecentWeightEntries(daysBack = 90) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recent-weight-entries', user?.id, daysBack],
    queryFn: async () => {
      const cutoffDate = subDays(new Date(), daysBack).toISOString();
      
      const { data, error } = await supabase
        .from('weight_sets')
        .select('entry_id, logged_date, exercise_key, source_routine_id, created_at')
        .gte('created_at', cutoffDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Group by entry_id
      const grouped = new Map<string, WeightEntryGrouped>();
      
      for (const row of data || []) {
        const existing = grouped.get(row.entry_id);
        if (existing) {
          existing.exercise_keys.add(row.exercise_key);
        } else {
          grouped.set(row.entry_id, {
            entry_id: row.entry_id,
            logged_date: row.logged_date,
            exercise_keys: new Set([row.exercise_key]),
            source_routine_id: row.source_routine_id,
          });
        }
      }
      
      return [...grouped.values()];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { WeightEntryGrouped } from '@/lib/repeated-entry-detection';

/**
 * Fetch recent weight entries grouped by entry_id for pattern detection.
 * 
 * Uses the most recently CREATED entries (by created_at), not by logged_date.
 * This ensures pattern detection works correctly when backdating entries.
 * 
 * @param limit Maximum number of entries to fetch (default: 500)
 */
export function useRecentWeightEntries(limit = 500) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['recent-weight-entries', user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_sets')
        .select('entry_id, logged_date, exercise_key, source_routine_id, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      
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

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSavedRoutines } from '@/hooks/useSavedRoutines';
import { useUserSettings } from '@/hooks/useUserSettings';
import { buildQuickAddUsage, selectQuickAddIds, QUICK_ADD } from '@/lib/quick-add';
import { SavedRoutine } from '@/types/weight';

/**
 * Quick Add candidates for the exercise log: saved routines the user logs on a
 * habitual share of their active days (plus any they've manually pinned).
 *
 * Apple Health imports are excluded so bulk-imported walks can't inflate the
 * active-day denominator (same exclusion the save-suggestion history uses).
 */
export function useQuickAddRoutines(alreadyLoggedRoutineIds: Iterable<string>) {
  const { user } = useAuth();
  const { data: savedRoutines } = useSavedRoutines();
  const { settings } = useUserSettings();

  const { data: usageRows } = useQuery({
    queryKey: ['quick-add-usage', 'exercise', user?.id],
    queryFn: async () => {
      const cutoff = format(subDays(new Date(), QUICK_ADD.WINDOW_DAYS), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('weight_sets')
        .select('logged_date, source_routine_id')
        .gte('logged_date', cutoff)
        .neq('raw_input', 'apple-health-import');

      if (error) throw error;
      return (data ?? []).map((row) => ({ date: row.logged_date, itemId: row.source_routine_id }));
    },
    enabled: !!user && settings.quickAddEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const loggedKey = [...alreadyLoggedRoutineIds].sort().join(',');

  return useMemo<SavedRoutine[]>(() => {
    if (!settings.quickAddEnabled || !savedRoutines?.length || !usageRows) return [];

    const { usage, activeDays } = buildQuickAddUsage(usageRows);
    const ids = selectQuickAddIds({
      availableIds: savedRoutines.map((r) => r.id),
      usage,
      activeDays,
      pinned: settings.quickAddPinned,
      hidden: settings.quickAddHidden,
      alreadyLoggedIds: loggedKey ? loggedKey.split(',') : [],
    });

    const byId = new Map(savedRoutines.map((r) => [r.id, r]));
    return ids.map((id) => byId.get(id)).filter((r): r is SavedRoutine => !!r);
  }, [
    savedRoutines,
    usageRows,
    loggedKey,
    settings.quickAddEnabled,
    settings.quickAddPinned,
    settings.quickAddHidden,
  ]);
}

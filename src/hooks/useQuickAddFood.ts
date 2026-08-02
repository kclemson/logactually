import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSavedMeals } from '@/hooks/useSavedMeals';
import { useUserSettings } from '@/hooks/useUserSettings';
import { buildQuickAddUsage, selectQuickAddIds, QUICK_ADD } from '@/lib/quick-add';
import { SavedMeal } from '@/types/food';

/**
 * Quick Add candidates for the food log: saved meals the user logs on a
 * habitual share of their active days (plus any they've manually pinned).
 *
 * Deliberately its own lightweight query rather than reusing the 90-day
 * save-suggestion history: two columns over 30 days, so it can't hit row caps
 * and can't perturb that feature's behavior.
 */
export function useQuickAddFood(alreadyLoggedMealIds: Iterable<string>) {
  const { user } = useAuth();
  const { data: savedMeals } = useSavedMeals();
  const { settings } = useUserSettings();

  const { data: usageRows } = useQuery({
    queryKey: ['quick-add-usage', 'food', user?.id],
    queryFn: async () => {
      const cutoff = format(subDays(new Date(), QUICK_ADD.WINDOW_DAYS), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('food_entries')
        .select('eaten_date, source_meal_id')
        .gte('eaten_date', cutoff);

      if (error) throw error;
      return (data ?? []).map((row) => ({ date: row.eaten_date, itemId: row.source_meal_id }));
    },
    enabled: !!user && settings.quickAddEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const loggedKey = [...alreadyLoggedMealIds].sort().join(',');

  return useMemo<SavedMeal[]>(() => {
    if (!settings.quickAddEnabled || !savedMeals?.length || !usageRows) return [];

    const { usage, activeDays } = buildQuickAddUsage(usageRows);
    const ids = selectQuickAddIds({
      availableIds: savedMeals.map((m) => m.id),
      usage,
      activeDays,
      pinned: settings.quickAddPinned,
      hidden: settings.quickAddHidden,
      alreadyLoggedIds: loggedKey ? loggedKey.split(',') : [],
    });

    const byId = new Map(savedMeals.map((m) => [m.id, m]));
    return ids.map((id) => byId.get(id)).filter((m): m is SavedMeal => !!m);
  }, [
    savedMeals,
    usageRows,
    loggedKey,
    settings.quickAddEnabled,
    settings.quickAddPinned,
    settings.quickAddHidden,
  ]);
}

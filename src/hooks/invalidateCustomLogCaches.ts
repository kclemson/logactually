import type { QueryClient } from '@tanstack/react-query';

/**
 * Centralized invalidation for every cache that reads from custom_log_entries.
 * Call from any mutation's onSuccess/onSettled so new caches can't get stale
 * just because a future mutation forgot one of the keys.
 */
export function invalidateCustomLogCaches(
  queryClient: QueryClient,
  opts: { logTypeId?: string | null; loggedDate?: string | null; userId?: string | null } = {}
) {
  const { logTypeId, loggedDate, userId } = opts;

  // Per-day entries (used by By-Date view)
  if (loggedDate) {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries', loggedDate] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries'] });
  }

  // Per-type entries (used by By-Type view)
  if (logTypeId) {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type', logTypeId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['custom-log-entries-for-type'] });
  }

  // All-medications-for-day (compliance view)
  queryClient.invalidateQueries({ queryKey: ['custom-log-entries-all-meds'] });

  // Calendar dots
  queryClient.invalidateQueries({ queryKey: ['custom-log-dates'] });

  // Inline / dashboard trend
  if (logTypeId && userId) {
    queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single', logTypeId, userId] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['custom-log-trend-single'] });
  }
}

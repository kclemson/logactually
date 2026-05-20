# Speed up custom log delete

## What's slow

Deleting a custom log entry feels laggy for two reasons:

1. **No optimistic update.** `deleteEntry` in `useCustomLogEntries.ts` waits for the network round-trip before invalidating queries, then waits again for the refetched entries before the row disappears from the UI. `updateEntry` already does optimistic updates — delete doesn't.

2. **Trend invalidation is too broad and now amplified.** `onSuccess` calls `invalidateQueries({ queryKey: ['custom-log-trend-single'] })` with no logTypeId, which refetches **every** inline trend chart currently mounted on the day's log page (we just added one per chartable group). Each of those refetches up to 10,000 rows from `custom_log_entries`. So deleting one Body Weight entry can trigger N large queries in parallel even though only one trend actually changed.

   Same pattern exists in `useAllMedicationEntries.deleteEntry` (invalidates `['custom-log-entries']` for all dates) and `useCustomLogEntriesForType.deleteEntry`.

## Fix

In `src/hooks/useCustomLogEntries.ts` `deleteEntry`:

- Accept the full entry (or `{ id, log_type_id }`) instead of just `id`, so we know which trend to touch.
- Add `onMutate` that:
  - Cancels in-flight `['custom-log-entries', dateStr]` queries
  - Optimistically removes the row from the entries cache
  - Optimistically removes the matching date point from `['custom-log-trend-single', log_type_id, user.id]` (filter by `logged_date`; for `dual_numeric` strip from both series)
  - Returns rollback snapshots
- `onError` restores both snapshots.
- `onSettled` invalidates **scoped** keys: `['custom-log-entries', dateStr]`, `['custom-log-trend-single', log_type_id, user.id]`, and `['custom-log-dates']` (cheap, needed for the calendar dot).

Update the two callers (`CustomLogEntriesView` non-med rows and the medication row in the same view) to pass the entry instead of just id.

For `useAllMedicationEntries.deleteEntry` and `useCustomLogEntriesForType.deleteEntry`: apply the same pattern — accept the entry, optimistic remove, and scope the trend invalidation to the single `log_type_id`.

## Out of scope

- No backend or schema changes.
- Not touching the trend chart component itself; its cache keys already include `logTypeId` so scoped invalidation lands cleanly.
- Leaving `OtherLog.tsx`'s `updateMedEntry` invalidation block alone — that's an edit path, not the reported delete path.

## Expected result

Row vanishes instantly on click; only the affected trend chart (if any) refetches in the background, not every chart on the page.

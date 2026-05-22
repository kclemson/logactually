## Goal

Fix the stale By-Type view after creating a medication entry, and prevent the recurring class of bug where a new mutation forgets to invalidate one of the parallel custom-log caches.

## Approach

Add a single helper that invalidates every custom-log-related query key, and call it from every mutation's `onSuccess`.

## Changes

1. **New file: `src/hooks/invalidateCustomLogCaches.ts`**
   - Export `invalidateCustomLogCaches(queryClient, { logTypeId?, loggedDate? })`.
   - Invalidates: `custom-log-entries`, `custom-log-entries-for-type`, `custom-log-entries-all-meds`, `custom-log-dates`, `custom-log-trend-single`.
   - When `logTypeId` / `loggedDate` are provided, scope those keys; otherwise invalidate the key broadly.

2. **`src/hooks/useCustomLogEntries.ts`**
   - Replace the per-mutation invalidation blocks in `createEntry`, `updateEntry`, and `deleteEntry` `onSuccess` with calls to the helper.

3. **`src/hooks/useCustomLogEntriesForType.ts`** (and `useAllMedicationEntries` if it has its own mutations)
   - Same swap — route any local mutation invalidations through the helper.

4. **`src/pages/OtherLog.tsx`**
   - Replace the hand-wired dual-key invalidation in `updateMedEntry` with the helper. Remove the now-redundant lines.

## Out of scope

- Optimistic updates across caches.
- Collapsing the parallel queries into a single source of truth (Option C).
- Any UI changes.

## Verification

- Log a new medication entry from the By-Type view → card list updates immediately.
- Edit and delete a medication entry → both By-Date and By-Type views stay in sync.
- Same checks for a non-medication custom log type.

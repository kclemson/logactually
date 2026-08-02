# Fix Quick Add flicker when changing days

## What's happening

Quick Add rows are filtered by "what's already logged on the viewed day". When you navigate to a different day, the day's entries are still being fetched, so for a moment the filter sees an empty (or previous day's) list and renders Quick Add rows for items that are in fact already logged. Once the day's data arrives, those rows disappear — the flicker you're seeing.

Confirmed in the code: `FoodLog` derives `loggedMealIds` from `entries` and `WeightLog` derives `loggedRoutineIds` from its sets; neither waits for the day's fetch to settle before feeding them to `useQuickAddFood` / `useQuickAddRoutines`.

## Fix

Make Quick Add render nothing until the viewed day's entries have actually loaded.

- Add a `ready` argument to `useQuickAddFood` and `useQuickAddRoutines`; when false, return an empty list (no rows rendered, no layout shift beyond the section appearing once).
- `FoodLog`: pass ready = day entries loaded (not in initial/refetch load for the selected date).
- `WeightLog`: pass the equivalent loading flag from its sets query.

This keeps all selection logic in `src/lib/quick-add.ts` unchanged and stays domain-agnostic for a future custom-log domain.

## Technical notes

- Files: `src/hooks/useQuickAddFood.ts`, `src/hooks/useQuickAddRoutines.ts`, `src/pages/FoodLog.tsx`, `src/pages/WeightLog.tsx`.
- Use the query's fetching state for the selected date (React Query `isPending`/`isFetching` on the day query), not a manual effect.
- The 30-day usage query is keyed only by user, so it isn't refetched per day and won't cause its own flicker.
- Existing `src/lib/quick-add.test.ts` cases stay valid; no threshold changes.

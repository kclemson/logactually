

# Fix: Atomic Group Portion Scaling via Dedicated Hook

## Overview

Extract the group portion scaling logic into a new hook (`useGroupPortionScale`) that performs a single atomic database save -- fixing both the missing child portion text updates and the flicker.

## Why a Hook (Not a Utility)

A pure utility can't help here because the operation needs access to React Query's `updateEntry` mutation, `queryClient` for invalidation, and optimistic state management. A custom hook is the right pattern -- it encapsulates the mutation, optimistic state, and derived maps, keeping FoodLog.tsx focused on orchestration.

## Root Cause Recap

1. **Missing portion text**: The "Done" button loops N times calling `onUpdateItemBatch` per item. Each call triggers `handleItemUpdateBatch` which reads `displayItems` (stale during the loop) and fires a separate `updateEntry.mutate()`. These race -- intermediate saves overwrite final ones, so some items' `portion` fields never get persisted.

2. **Flicker**: N+1 separate mutations (N item updates + 1 multiplier update) each trigger query invalidation and refetch. Old server data briefly appears between invalidations.

## Technical Details

### New file: `src/hooks/useGroupPortionScale.ts`

Encapsulates:
- `optimisticMultipliers` state (moved from FoodLog)
- `optimisticGroupNames` state (moved from FoodLog)
- Derived `entryPortionMultipliers` map (moved from FoodLog)
- Derived `entryGroupNames` map (moved from FoodLog)
- `scaleGroupPortion(entryId, multiplier)` -- the atomic handler:
  1. Gets all items for the entry via a passed-in getter
  2. Applies `scaleItemByMultiplier` to every item in one pass (this includes portion text scaling)
  3. Computes new cumulative multiplier
  4. Sets optimistic multiplier state
  5. Calls `updateEntry.mutate()` ONCE with both updated `food_items` AND `group_portion_multiplier`
  6. On success: awaits query invalidation, then clears optimistic state
- `updateGroupName(entryId, newName)` -- the existing inline-edit handler, moved here

### Modified: `src/components/FoodItemsTable.tsx`

Replace both "Done" button implementations (collapsed ~line 463, expanded ~line 601):

**Before:**
```
for (let i = boundary.startIndex; i <= boundary.endIndex; i++) {
  onUpdateItemBatch?.(i, scaleItemByMultiplier(items[i], groupPortionMultiplier));
}
onUpdateEntryPortionMultiplier?.(boundary.entryId, existing * groupPortionMultiplier);
```

**After:**
```
onScaleGroupPortion?.(boundary.entryId, groupPortionMultiplier);
```

Replace `onUpdateEntryPortionMultiplier` prop with `onScaleGroupPortion` prop.

### Modified: `src/pages/FoodLog.tsx`

- Import and call `useGroupPortionScale`, passing `entries`, `updateEntry`, `queryClient`, and `getItemsForEntry`
- Remove ~60 lines of inline state and handlers (optimistic multipliers/names, derived maps)
- Pass `onScaleGroupPortion` and `onUpdateGroupName` from the hook to `FoodItemsTable`

## File Summary

| File | Change |
|------|--------|
| `src/hooks/useGroupPortionScale.ts` | **New** -- hook with atomic scale + optimistic state |
| `src/pages/FoodLog.tsx` | Remove optimistic state/maps/handlers, use new hook instead |
| `src/components/FoodItemsTable.tsx` | Replace `onUpdateEntryPortionMultiplier` prop with `onScaleGroupPortion`; simplify "Done" button to single call |


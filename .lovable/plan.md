
# Fix: Make Group Portion Scaling Feel Instant (Optimistic Update)

## Problem
When you scale a group's portion (e.g., "Done" on the stepper), there's a noticeable delay before the "(1.5 portions)" label updates. This is because the multiplier is persisted to the server via `updateEntry.mutate()`, and the UI waits for the network round-trip + query refetch before showing the new value.

Individual item scaling feels instant because it uses `useEditableItems` with local `pendingEdits` state -- the UI updates immediately in memory, then saves in the background.

## Solution
Add optimistic local state for the group portion multiplier, so the label updates immediately when "Done" is tapped, while the server save happens in the background.

## Technical Details

### `src/pages/FoodLog.tsx`

1. Add a local `optimisticMultipliers` state (`Map<string, number>`) alongside the existing memoized `entryPortionMultipliers`.

2. When building the map passed to `FoodItemsTable`, merge the server-derived values with any optimistic overrides (optimistic takes priority).

3. In the `onUpdateEntryPortionMultiplier` callback:
   - Immediately set the optimistic value in local state (instant UI update).
   - Then call `updateEntry.mutate(...)` as before.
   - On successful mutation + query invalidation, clear the optimistic entry (server data now has the correct value).

This mirrors the pattern used by `useEditableItems` where local pending state overlays server data for instant feedback.

### Files changed
| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Add `optimisticMultipliers` state, merge into the map passed to `FoodItemsTable`, set optimistic value before calling mutate, clear on settle |

No database or type changes needed -- this is purely a UI responsiveness fix.

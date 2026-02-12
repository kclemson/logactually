

## Fix: Wire up `onDeleteEntry` in FoodLog

The "Delete this group" link doesn't appear because `FoodLog.tsx` never passes an `onDeleteEntry` prop to `FoodItemsTable`. The code we added correctly guards on `onDeleteEntry` existing, but since it's not provided, the link never renders.

By contrast, `WeightLog.tsx` already passes `onDeleteEntry={handleDeleteEntry}` (line 682), so the exercise log version should work.

### Changes

**`src/pages/FoodLog.tsx`**

1. Add a `handleDeleteEntry` callback that calls `deleteEntry.mutate(entryId)` and collapses the expanded entry.
2. Pass `onDeleteEntry={handleDeleteEntry}` to the `FoodItemsTable` component (around line 791).

This is a small wiring fix -- the delete group UI in `FoodItemsTable.tsx` is already correct, it just needs the callback to be provided.


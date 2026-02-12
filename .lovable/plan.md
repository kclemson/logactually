

## Add "Delete this group" for multi-item entries in both Food and Exercise logs

This adds a "Delete this group (N items)" link with a confirmation dialog to the expanded section of multi-item entries in both the Food log and Exercise log.

### Changes

**1. `src/components/FoodItemsTable.tsx` -- expanded section (around lines 693-703)**

After the "Save as meal" / saved meal info block, add a "Delete this group (N items)" link that:
- Only renders when `onDeleteEntry` is provided AND the entry has 2+ items
- Shows in red/destructive color
- Opens an AlertDialog confirmation with:
  - Title: "Delete this group?"
  - Description: "This will permanently remove N items: [first description] to [last description]."
  - Cancel and Delete buttons
- On confirm, calls `onDeleteEntry!(entryId)`

Layout becomes a flex row with gap between "Save as meal" and "Delete this group (N items)".

**2. `src/components/WeightItemsTable.tsx` -- expanded section (around lines 827-838)**

Same pattern: after the "Save as routine" / routine info block, add a "Delete this group (N items)" link that:
- Only renders when `onDeleteEntry` is provided AND `entryExercises.length > 1`
- Same destructive styling and AlertDialog confirmation
- Description: "This will permanently remove N items: [first description] to [last description]."
- On confirm, calls `onDeleteEntry!(currentEntryId!)`

### What stays the same

- Single-item entries: no "Delete this group" link shown (users use the per-row trash icon)
- Existing per-row and per-entry trash icon behavior unchanged
- No new props, callbacks, or files needed
- AlertDialog components already imported in both files

### Two files changed, same pattern in each.




# Remove redundant "Delete this group" text link from expanded panel

## Summary

Now that the grouped entry UI has a delete icon on the group header row (with its own confirmation dialog), the text-based "Delete this group (N items)" link in the expanded details panel is redundant. This removes that link while keeping the group header delete icon and its confirmation dialog intact.

## Changes

### 1. `src/components/EntryExpandedPanel.tsx`
- Remove the `DeleteGroupDialog` import
- Remove the `items` and `onDeleteEntry` props from the interface
- Remove the `DeleteGroupDialog` rendering block (lines 84-89)
- Since those were the only reason for the `flex items-center justify-between` wrapper, simplify the layout: the saved-item info / "Save as" button no longer needs the justify-between wrapper
- Update the JSDoc comment

### 2. `src/components/FoodItemsTable.tsx`
- Stop passing `items` and `onDeleteEntry` to `EntryExpandedPanel`

### 3. `src/components/WeightItemsTable.tsx`
- Remove the unused `DeleteGroupDialog` import (line 30)
- Stop passing `items` and `onDeleteEntry` to `EntryExpandedPanel`

### 4. `src/components/DeleteGroupDialog.tsx`
- Keep the file -- it may still be imported directly elsewhere or useful in the future. But if it's now fully unused after these changes, it can be deleted.

## What stays

- The trash icon on group header rows in both Food and Weight tables
- The confirmation AlertDialog triggered by that trash icon
- All other expanded panel content ("Logged as", "From saved meal/routine", "Save as" button)

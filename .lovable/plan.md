# Completed: Simplify Highlighting + Fix Delete Flicker

**Status**: ✅ Implemented

## Summary

Removed the complex optimistic `newItems` array that caused timing bugs (outline flash), replaced it with an extended button loading state for feedback, and fixed delete icon color flicker.

## Changes Made

1. **`src/hooks/useEditableItems.ts`**: Removed `newItems`, `newItemUids`, `addNewItems`, `removeNewItemsByEntry`, `clearNewHighlights`. Added `markEntryAsNew()` for triggering highlights after query returns.

2. **`src/hooks/useFoodEntries.ts`**: Added `isFetching` to return object.

3. **`src/pages/FoodLog.tsx`**: Added `pendingEntryId` tracking, extended loading state until rows visible, removed optimistic UI calls.

4. **`src/components/FoodItemsTable.tsx`**: Removed `newItemUids` prop and `isNewItem` function, removed fallback highlight logic, fixed delete button sizing (h-6 w-6 p-0 instead of h-11 w-11 -m-2.5).

5. **`src/components/CreateMealDialog.tsx`**: Uses local `localItems` state instead of `addNewItems`.

## Visual Result

- "Adding..." button stays loading until rows actually render
- Grouped outline appears correctly (no flash of individual outlines)
- Delete icon hover is smooth (no color flicker)

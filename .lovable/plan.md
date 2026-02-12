

## Left-align the bullet list in "Delete this group" dialog

The list items are currently centered because the `AlertDialogHeader` applies `text-center` by default. Add `text-left` to the `<ul>` in both files.

### Changes

**`src/components/FoodItemsTable.tsx`** (~line 722)
Add `text-left` to the `<ul>` className.

**`src/components/WeightItemsTable.tsx`** (~line 856)
Same change.


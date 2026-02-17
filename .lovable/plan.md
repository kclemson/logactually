

# Fix: Chevron always visible on single-item entries

## Problem

After deleting one exercise from a 2-item group, the remaining single item loses its chevron because the `isExpandable` check requires `hasRawInput || isFromRoutine`. But the `raw_input` was often stored on the deleted row, so the surviving item has no raw input and no routine link -- the chevron disappears and the user can't expand/collapse or access "Save as routine".

## How the Food Log handles it

In `FoodItemsTable.tsx`, the chevron renders unconditionally on the last item of every entry (line 732-735). There is no `isExpandable` gate -- if it's the last item in a boundary, it gets a chevron.

## Fix

In `WeightItemsTable.tsx`, remove the `isExpandable` gate for non-group items. The chevron should render on any `isLastInEntry` item that doesn't belong to a group, matching the Food Log pattern exactly.

### Technical detail

**File: `src/components/WeightItemsTable.tsx`**

Change the chevron rendering condition from:

```
isLastInEntry && isExpandable
```

to:

```
isLastInEntry && !belongsToGroup
```

This removes the `isExpandable` variable entirely (or keeps it unused). The chevron will always be available on single-item entries, letting users expand to see "Save as routine", "Logged as", and delete options -- then collapse again freely.

This matches the Food Log's behavior exactly.




## Right-justify "Delete this group" link

Currently the "Save as meal/routine" and "Delete this group" elements are stacked vertically as siblings inside a `space-y-2` div. We'll wrap them in a flex row so "Save as meal" stays left and "Delete this group" pushes to the right.

### Changes

**Both `src/components/FoodItemsTable.tsx` and `src/components/WeightItemsTable.tsx`**

Wrap the "Save as meal/routine" block and the "Delete this group" AlertDialog block in a single `<div className="flex items-center justify-between">` container. This keeps "Save as meal/routine" (or "From saved meal/routine") on the left and pushes "Delete this group (N items)" to the far right.

Specifically:
- **FoodItemsTable.tsx** (around lines 678-734): Wrap the meal info / save-as-meal conditional and the delete-group IIFE in a flex `justify-between` div.
- **WeightItemsTable.tsx** (around lines 813-869): Same pattern for the routine info / save-as-routine conditional and delete-group IIFE.

This is a layout-only change -- no logic modifications needed.

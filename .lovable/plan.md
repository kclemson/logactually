
# Remove semibold font from expanded group header

## Problem
In `FoodItemsTable.tsx`, the expanded group header (line 550) has `font-semibold` on the description cell wrapper, but the collapsed group header (line 371) does not. When toggling between collapsed and expanded states, the text weight jumps from normal to semibold, causing a visible flicker/layout shift.

## Fix

### `src/components/FoodItemsTable.tsx`
Remove `font-semibold` from the expanded group header's description wrapper on line 550. This makes it consistent with the collapsed header (line 371) and the WeightItemsTable headers, which all use normal font weight.

Single class removal, one line change.

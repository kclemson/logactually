

# Fix action links not spreading to full width on short entries

## Problem
The container holding "Save as meal", "Copy to today", and "Details" doesn't stretch to the full panel width. It only takes the natural width of its content. For entries with long text, it happens to fill the space, but for short entries (like "Signature edamame"), the container is narrow and `justify-between` has no room to separate the left and right actions.

## Fix

### `src/components/EntryExpandedPanel.tsx`
Add `w-full` to the inner `div` on line 58 so it always stretches to fill the parent flex container. This ensures `justify-between` on the actions row works regardless of text length.

Single class addition, one line change.


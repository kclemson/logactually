

# Fix: Collapsed Group Header Appearing in Wrong Position

## Problem
When expanding one group and collapsing another, the collapsed group's header row can appear in the middle of the expanded group's child items. This happens because collapsed group rows are inserted into the `rows` array using `rows.splice(boundary.startIndex, 0, ...)` (line 809), where `boundary.startIndex` is the index in the **items** array. But the `rows` array has different indexing -- items from other collapsed groups are skipped, and expanded groups inject extra header rows, making the splice position incorrect.

## Fix
Render collapsed group headers inline during the main `items.forEach` loop rather than splicing them in afterward. When the loop encounters the first index of a collapsed group boundary, it pushes the collapsed header row directly into `rows` at that point (and the rest of the items in that boundary are already skipped via `collapsedGroupIndices`).

## Technical Details

### `src/components/FoodItemsTable.tsx`

**Remove** the post-loop splice block (lines ~795-890) that iterates `groupHeaders` and calls `rows.splice(boundary.startIndex, 0, ...)`.

**Add** to the main `items.forEach` loop: at the top, before the existing `if (collapsedGroupIndices.has(index)) return;` check, detect if `index` is the `startIndex` of a collapsed group. If so, render the collapsed header row (the same JSX currently in the splice block), push it to `rows`, and then `return` to skip rendering the individual item.

This ensures every row is pushed in the correct visual order during a single pass, regardless of which groups are expanded or collapsed.

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Move collapsed group header rendering from post-loop splice into the main forEach loop, triggered when `index === boundary.startIndex` for a collapsed group |


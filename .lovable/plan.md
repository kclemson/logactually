

## Fix Calendar Cell Vertical Centering (Take 2)

### Root Cause

`grid-rows-3` expands to `grid-template-rows: repeat(3, 1fr)`. The three `1fr` tracks always stretch to consume the full container height, leaving zero free space for `content-center` to work with. That is why the previous one-word fix was invisible.

### Solution

On line 197 of `src/pages/History.tsx`, replace `grid-rows-3` with `grid-rows-[auto_auto_auto]`. Each row then sizes to its content, and `content-center` vertically centers the group within the cell's `min-h-[64px]`.

### File Changed

| File | Change |
|------|--------|
| `src/pages/History.tsx` | Line 197: `grid-rows-3` becomes `grid-rows-[auto_auto_auto]` (rest of the class list unchanged) |

One class name swap, no other changes.


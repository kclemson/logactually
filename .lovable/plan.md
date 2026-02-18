

# Tighten view-mode spacing and verify select font size

## Problem
Two issues:
1. In view-only mode, there is excess space between labels and values due to `pl-2` padding on the value span and oversized label min-widths.
2. The `text-xs` change on select dropdowns from the previous edit may not be visually apparent yet (it was applied in the code).

## Changes

### 1. Remove `pl-2` from view-mode value span (`src/components/DetailDialog.tsx`, line 169)
Change:
```
<span className="text-sm min-w-0 truncate pl-2">
```
to:
```
<span className="text-sm min-w-0 truncate">
```
The container already has `gap-1.5` providing spacing, so `pl-2` is redundant and wastes 8px.

### 2. Reduce label min-width from `4.5rem` to `4rem`
In both `src/pages/WeightLog.tsx` (lines 778, 802) and `src/pages/FoodLog.tsx` (lines 875, 892), change `min-w-[4.5rem]` to `min-w-[4rem]`. This recovers another ~8px per label.

### Select font size
The `text-xs` change on `<select>` elements was already applied in the previous edit (line 226). It should be active — if it's not visible in the preview, it may need a refresh. No additional code change needed here.

## Files changed

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | Remove `pl-2` from view-mode value span (line 169) |
| `src/pages/WeightLog.tsx` | `min-w-[4.5rem]` to `min-w-[4rem]` (2 places) |
| `src/pages/FoodLog.tsx` | `min-w-[4.5rem]` to `min-w-[4rem]` (2 places) |


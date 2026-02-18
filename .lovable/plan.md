

# Fix Detail Dialog spacing so Distance values aren't truncated

## Problem
The Distance value and unit toggle get clipped on mobile because the label column and inter-column gap consume too much space. The fix applies universally (not mobile-specific).

## Changes

### 1. `src/components/DetailDialog.tsx` — reduce grid gap
Change `gap-x-4` to `gap-x-2` in both the view grid (line 298) and edit grid (line 339). This recovers 8px of horizontal space.

### 2. `src/pages/WeightLog.tsx` — shrink label min-width
Change `min-w-[5rem]` to `min-w-[4.5rem]` on lines 778 and 802.

### 3. `src/pages/FoodLog.tsx` — shrink label min-width
Change `min-w-[5rem]` to `min-w-[4.5rem]` on lines 875 and 892.

Together these recover roughly 24px of horizontal space, which is more than enough for the Distance value + unit toggle to render without truncation.

## Files changed

| File | What |
|------|------|
| `src/components/DetailDialog.tsx` | `gap-x-4` to `gap-x-2` (2 places) |
| `src/pages/WeightLog.tsx` | `min-w-[5rem]` to `min-w-[4.5rem]` (2 places) |
| `src/pages/FoodLog.tsx` | `min-w-[5rem]` to `min-w-[4.5rem]` (2 places) |


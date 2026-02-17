

# Tighten chart grid spacing to prevent title wrapping on mobile

## Problem

Long chart titles like "Estimated Exercise Calorie Burn" wrap to two lines on mobile because the combination of layout padding (`px-3` on `<main>`) and grid gap (`gap-3` between chart columns) leaves each chart too narrow.

## Approach

Reduce the inter-column gap from `gap-3` (12px) to `gap-2` (8px) on the 2-column chart grids, and widen the existing negative margin hack from `-mx-1` to `-mx-2` to reclaim a bit more edge space. This gives each chart ~6px more width total, which should prevent the title wrap without making the layout feel cramped.

## Changes

**`src/pages/Trends.tsx`**

1. Root container: change `-mx-1` to `-mx-2` (line 295)
2. Food charts 2-col grid: change `gap-3` to `gap-2` (line 323)
3. P/C/F 3-col grid: change `gap-1` stays as-is (already tight)
4. Exercise charts 2-col grid: change `gap-3` to `gap-2` (line 438)
5. Custom log charts 2-col grid: change `gap-3` to `gap-2` (line 494)

Five single-class tweaks in one file, no logic changes.

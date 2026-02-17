

# Fix Estimated Exercise Calorie Burn tooltip width and spacing

## Problem

The `BurnTooltip` in `CalorieBurnChart.tsx` is a standalone tooltip component (not using `CompactChartTooltip`), so it missed the `w-max` fix. The exercise count string (e.g., "15 exercises (4 cardio, 11 strength)") is long and wraps awkwardly, and the tooltip feels cramped at the edges.

## Changes

**`src/components/trends/CalorieBurnChart.tsx`** -- line 55

1. Add `w-max` to the tooltip container so it sizes to its content (same fix as `CompactChartTooltip`)
2. Increase horizontal padding from `px-2` to `px-3` to add breathing room at the edges
3. Shrink the exercise count line from `text-[10px]` to `text-[9px]` since it's supplementary info and the longest line

Change:
```tsx
<div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-2 py-1 shadow-md">
```
To:
```tsx
<div className="rounded-md border border-border/50 bg-white dark:bg-slate-800 px-3 py-1 shadow-md w-max">
```

And on line 61, change:
```tsx
<p className="text-[10px] text-muted-foreground">{exerciseText}</p>
```
To:
```tsx
<p className="text-[9px] text-muted-foreground">{exerciseText}</p>
```

Two class tweaks in one file.


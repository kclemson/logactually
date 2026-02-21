

# Fix "Go to day" Navigating to Exercise Names Instead of Dates

## Problem
Tapping "Go to day" on a custom/saved chart tooltip navigates to `/weights?date=Leg%20Curl` instead of a real date. This happens on categorical charts (e.g., grouped by exercise name) where the data points don't have a `rawDate` field.

## Root Cause
In `DynamicChart.tsx` line 133, the `rawDate` prop has a fallback:

```typescript
rawDate={
  (chartData[activeBarIndex] as any)?.rawDate
    ?? chartData[activeBarIndex]?.[xAxis.field]  // <-- BUG: falls back to x-axis value
}
```

For date-based charts, `rawDate` exists on each data point and this works fine. But for categorical charts (e.g., "Leg Curl volume by exercise"), there's no `rawDate` field, so it falls back to `xAxis.field` which is the exercise name.

## Fix

### `src/components/trends/DynamicChart.tsx`
Remove the fallback to `xAxis.field`. Only pass `rawDate` when the data point actually has one:

```typescript
rawDate={
  interaction.activeBarIndex !== null
    ? (chartData[interaction.activeBarIndex] as any)?.rawDate
    : undefined
}
```

This way, when `rawDate` is `undefined`, the CompactChartTooltip already hides the "Go to day" button (the existing guard `isTouchDevice && onGoToDay && rawDate` handles it). So categorical charts simply won't show the button -- which is the correct behavior since there's no specific day to navigate to.

## Files Modified
- `src/components/trends/DynamicChart.tsx` -- single line change (remove `xAxis.field` fallback)


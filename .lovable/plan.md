

## Fix: Disable click-to-navigate on categorical charts

### Problem
Clicking a bar on a categorical chart (like "Exercise days vs rest days" with "Only Walking" / "Other Sessions" on the X axis) navigates to a random date — whatever `rawDate` happens to be on that data point. Navigation to a specific day only makes sense when the X axis represents dates.

### Fix

**File: `src/components/trends/DynamicChart.tsx`**

Pass `onNavigate` to `useChartInteraction` only when the chart is date-based. The `isCategorical` flag already exists on line 97.

| Line | Before | After |
|------|--------|-------|
| 101 | `onNavigate,` | `onNavigate: isCategorical ? undefined : onNavigate,` |

One line. Categorical charts will still show tooltips on tap (touch) and on hover (desktop), but clicking won't navigate anywhere. The "Go to day →" link in touch tooltips will also be suppressed automatically since `onNavigate` will be undefined.


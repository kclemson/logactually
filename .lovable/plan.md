

# Add compare breakdown to chart tooltips

## Problem
When a chart uses `compare` (e.g., Net Daily Calories = food calories - exercise calories burned), the tooltip only shows the final net value. There's no way to see the two component values, making it hard to verify the math.

## Solution
Attach a `_compareBreakdown` object to each data point during DSL execution, then render it in the tooltip.

## Technical Details

**File: `src/lib/chart-dsl.ts`**

In the `date` groupBy case (lines 173-206), when `dsl.compare` is active, attach breakdown metadata to the data point:

```typescript
// After computing finalValue and cmpVal:
_compareBreakdown: dsl.compare ? {
  primary: Math.round(value),
  primaryLabel: dsl.derivedMetric || dsl.metric,
  compare: cmpVal !== null ? Math.round(cmpVal) : null,
  compareLabel: cmpMetric,
} : undefined,
```

Same pattern for the `week` groupBy case -- but since values are bucketed before aggregation, we'll aggregate the primary and compare sums separately and attach the breakdown to each week bucket.

**File: `src/components/trends/CompactChartTooltip.tsx`**

Add a new section that renders when `_compareBreakdown` exists on the payload data:

```
Eaten: 217 cal
Burned: 321 cal
```

This appears between the main value line and the existing `_details` section. Uses the same compact `text-[9px]` styling as details.

## Files modified
- `src/lib/chart-dsl.ts` -- attach `_compareBreakdown` to data points in `date` and `week` cases
- `src/components/trends/CompactChartTooltip.tsx` -- render the breakdown when present

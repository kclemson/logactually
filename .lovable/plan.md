

# Skip Zero-Value Items in Item-Grouped Charts

## Problem
When charting any metric grouped by item, items that don't track that metric appear as 0-value bars. This applies broadly:
- Cardio exercises have 0 sets/reps/weight
- Strength exercises have 0 distance/speed/cadence
- Heart rate, calories_burned, duration, incline, effort, speed — all can be absent
- Food items often have 0 for fiber, sugar, sodium, cholesterol, saturated_fat

Maintaining separate "optional" vs "required" metric lists is fragile and will break as new metrics are added.

## Solution
For `groupBy: "item"` only, skip any item where the computed `metricValue` rounds to 0. This is safe because:
- An item cannot exist in the aggregation data with 0 entries/count
- If a metric is 0 for an item, it means "not tracked" in virtually all cases
- Time-series groupings (date, week, etc.) are unaffected — zero is valid data there

## Changes

### `src/lib/chart-dsl.ts`

Two one-line additions in the `groupBy: "item"` branch:

1. **Food items** (around line 306, before `dataPoints.push`):
```typescript
if (metricValue === 0) continue;
```

2. **Exercise items** (around line 332, before `dataPoints.push`):
```typescript
if (metricValue === 0) continue;
```

No "optional metrics" sets needed. No other files, schema, or edge function changes.

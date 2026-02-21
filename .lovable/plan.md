

# Support max/min Aggregation for Item-Grouped Charts

## Problem
When the AI generates a DSL with `groupBy: "item"` and `aggregation: "max"`, the chart currently shows **total** calories across all logged instances of that food item, not the **highest single-entry** calorie count. This is because the data layer only stores running totals per item bucket — individual entry values are discarded during aggregation.

## Solution
Track per-entry metric values in the item accumulator so `executeDSL` can compute true `max`/`min`.

## Changes

### 1. `src/lib/chart-types.ts` — Extend `foodByItem` and `exerciseByItem` types
Add an optional `metricValues` array to each item bucket that stores individual entry-level values keyed by metric name.

For food items, add:
```
perEntryCalories: number[];
perEntryProtein: number[];
perEntryCarbs: number[];
perEntryFat: number[];
// ... etc for each metric
```

A simpler approach: add a single `valuesPerEntry: Record<string, number[]>` map to each item bucket, storing arrays of per-entry values keyed by metric name (e.g., `{ calories: [320, 450, 280], protein: [12, 18, 10] }`).

### 2. `src/lib/chart-data.ts` — Populate per-entry values during aggregation

In the food item accumulator loop, push each item's individual calorie/protein/etc values into the new `valuesPerEntry` arrays alongside the existing running totals.

Similarly for exercise items, push individual set-level values (duration, distance, etc.).

### 3. `src/lib/chart-dsl.ts` — Use per-entry values for max/min in item groupBy

In the `case "item"` branch of `executeDSL`, when `dsl.aggregation` is `"max"` or `"min"`:
- Read from `item.valuesPerEntry[metric]`
- Apply `Math.max(...values)` or `Math.min(...values)`
- Fall back to the current total-based logic if the array isn't present (backward compat)

When aggregation is `"sum"` or `"average"`, behavior stays exactly the same as today.

---

## Technical Detail

```text
Current flow (item groupBy):
  foodByItem["vanilla yogurt"].totalCalories = 2203  (sum of all entries)
  --> max aggregation just returns 2203 (wrong)

New flow:
  foodByItem["vanilla yogurt"].totalCalories = 2203
  foodByItem["vanilla yogurt"].valuesPerEntry.calories = [320, 450, 280, 400, ...]
  --> max aggregation returns Math.max(320, 450, 280, 400, ...) = 450 (correct)
```

## Files Modified
- `src/lib/chart-types.ts` — add `valuesPerEntry` to item bucket types
- `src/lib/chart-data.ts` — populate `valuesPerEntry` during food and exercise item aggregation
- `src/lib/chart-dsl.ts` — read `valuesPerEntry` when aggregation is `max` or `min`

No database changes needed. No edge function changes needed — the DSL schema already supports `max`/`min` in the `aggregation` field; the client-side engine just needs to honor it for item groupings.


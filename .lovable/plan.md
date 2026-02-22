

# Fix: Implement `compare` support in the Chart DSL engine

## Problem
The AI correctly generates a DSL with a `compare` field (`{ metric: "calories_burned", source: "exercise" }`) to create a "Net Daily Calories" chart (food calories minus exercise calories burned). However, the `executeDSL` engine in `chart-dsl.ts` never reads `dsl.compare` -- it only processes the primary `source` and `metric`. The chart therefore shows raw food calories instead of net calories.

## Solution
After computing the primary `value` for each data point (in the `date` and `week` groupBy cases), subtract the compare metric's value from it. This is a small addition to the existing engine logic.

## Technical Details

**File: `src/lib/chart-dsl.ts`**

In the `case "date"` block (around line 173), after computing the primary value, look up the compare metric and subtract it:

```typescript
// Inside the date case, when building each data point:
let primaryValue = value;
if (dsl.compare) {
  const compareSource = dsl.compare.source ?? dsl.source;
  const compareMetric = METRIC_COMPAT[dsl.compare.metric] ?? dsl.compare.metric;
  const compareVal = extractValue(compareSource, compareMetric, undefined, dailyTotals, date);
  if (compareVal !== null) {
    primaryValue -= compareVal;
  }
}
// Use primaryValue instead of value for Math.round(...)
```

The same pattern applies to the `case "week"` block where values are bucketed before aggregation -- the compare subtraction should happen per-date before bucketing.

**File: `src/lib/chart-data.ts`**

The `fetchChartData` function likely only fetches data for the primary `source`. When `compare` references a different source (e.g., primary is `food` but compare is `exercise`), we need to ensure both sources' data is fetched. This requires checking if `dsl.compare?.source` differs from `dsl.source` and fetching both.

## Changes summary

| File | Change |
|---|---|
| `src/lib/chart-dsl.ts` | Apply `compare` subtraction in `date` and `week` groupBy cases |
| `src/lib/chart-data.ts` | Ensure data for the compare source is fetched when it differs from the primary source |

## Edge cases
- If the compare source has no data for a given date, the primary value is used as-is (no subtraction)
- Negative net values are valid and should display correctly (e.g., ate less than burned)
- The `compare` field is optional, so all existing charts are unaffected


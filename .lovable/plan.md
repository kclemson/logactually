

## Fix aggregate verification for "by day of week" charts

### Problem
When the AI generates an "Average Daily Calories by Day of Week" chart, it correctly averages across all occurrences of each weekday (e.g., all 4 Wednesdays in a 30-day span). But the verification step relies on the AI's self-declared `verification.breakdown.dates` arrays to know which dates belong to each bucket. If the AI only lists a subset of dates (or just the most recent one), the verifier computes the "average" over fewer dates than the AI actually used -- leading to large deltas and a misleading 1/7 accuracy score.

### Solution
Add a **deterministic categorical verification path** for weekday-bucketed charts. Instead of trusting the AI's breakdown, we group all dates in `dailyTotals` by their actual day of the week, compute the expected aggregate ourselves, and compare.

### Changes

**Single file: `src/lib/chart-verification.ts`**

1. Add a new function `verifyCategoricalWeekday` that:
   - Detects weekday labels in the chart data (e.g., "Monday", "Mon", "Wednesday", etc.)
   - Groups all dates from `dailyTotals` by their weekday
   - Looks up the field using existing `FOOD_KEY_MAP` / `EXERCISE_KEY_MAP` (or the AI's declared field as fallback)
   - Uses the AI's declared method ("average", "sum", etc.) or defaults to "average" for weekday charts
   - Computes expected values per weekday bucket and compares to the AI's data points

2. Insert this as a new step in `verifyChartData`, between the deterministic check and the AI-declared fallback:
   - After `verifyDeterministic` returns "unavailable"
   - Before falling through to `verifyDaily` / `verifyAggregate`
   - Only activates when the data points have weekday-shaped labels

### Technical details

**Weekday detection**: Match data point labels against known weekday names (full and abbreviated: "Monday"/"Mon", "Tuesday"/"Tue", etc.). If most labels match, treat it as a weekday-bucketed chart.

**Date grouping**: For each date in `dailyTotals[source]`, compute `new Date(date).getDay()` and map to the weekday name. Group all dates into 7 buckets.

**Aggregation**: Use the AI's `verification.method` if declared, otherwise default to "average" (the most common intent for "by day of week" questions).

**Field resolution**: Reuse the existing `FOOD_KEY_MAP` / `EXERCISE_KEY_MAP` / `DERIVED_FORMULAS` to find the right field, falling back to the AI's `verification.field`.

**Matching data points to buckets**: Normalize both the chart label and our computed weekday name to the same format (e.g., lowercase full name) for comparison.

```
verifyChartData flow (updated):

  1. verifyDeterministic  -- date-indexed, known metric
  2. verifyCategoricalWeekday  [NEW]  -- weekday-bucketed, known metric
  3. AI-declared daily/aggregate  -- fallback
  4. unavailable
```

This approach is higher confidence than `verifyAggregate` because it computes the date groupings from authoritative data rather than trusting the AI's breakdown. It uses "deterministic" as the method label since the computation is fully deterministic.


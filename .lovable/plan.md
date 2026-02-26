

## Validation: `exerciseMetricContributors` approach

The architecture is correct. Here's why, and one refinement.

### Why this must happen in `chart-data.ts`, not `chart-dsl.ts`

By the time `executeDSL` runs, exercise data is already collapsed into `ExerciseDayTotals` per date — one aggregate object with no way to distinguish which rows contributed to a specific metric. The row-level loop in `fetchExerciseData` is the only place where we can check `row[metric] > 0` and build a filtered parallel aggregate. No alternative avoids this.

### The approach is minimal

- **No extra queries** — same `weight_sets` fetch, one additional accumulator during the existing loop
- **No new types to plumb** — `exerciseMetricContributors` is an optional field on `DailyTotals`, same shape as `exercise` with an added `contributorCount`
- **Fallback is free** — `chart-dsl.ts` checks `exerciseMetricContributors?.[date]` first, falls back to `exercise[date]`, so all existing behavior is preserved

### One refinement: only populate when needed

The contributor tracking only matters for `groupBy: "date"` exercise charts without a filter (if `exerciseKey` or `category` is already set, the data is pre-filtered). We should gate it:

```
const needsContributors = dsl.groupBy === "date" 
  && dsl.source === "exercise" 
  && !dsl.filter?.exerciseKey 
  && !dsl.filter?.category;
```

This avoids unnecessary work for item/category/hourly charts.

### Changes

| File | What |
|------|------|
| `src/lib/chart-types.ts` | Add `exerciseMetricContributors?: Record<string, ExerciseDayTotals & { contributorCount: number }>` to `DailyTotals` |
| `src/lib/chart-data.ts` | Accept optional `primaryMetric` param in `fetchExerciseData`; when set and no filter active, build contributor map from rows where `row[metric] > 0` |
| `src/lib/chart-dsl.ts` | In date-grouped exercise tooltip enrichment (~line 258), prefer `exerciseMetricContributors[date]` over `exercise[date]` |
| `src/hooks/useGenerateChart.ts` | Pass `dsl.metric` through to `fetchChartData` (already passes full DSL — no change needed) |


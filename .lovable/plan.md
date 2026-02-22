

# Fix: Edited chart title not reflected after save

## Problem
When you edit a chart title in the CustomChartDialog and save, the title updates in the database but the Trends page continues showing the old title. This happens because the `liveSpecs` query (which re-executes DSL for fresh data) has `staleTime: 60_000` and its query key (`["saved-charts-live", v2ChartIds, selectedPeriod]`) doesn't change when only the chart content (title/aiNote) is updated -- same IDs, same period. So React Query serves the cached result with the old title.

## Solution
Invalidate the `["saved-charts-live"]` query whenever saved charts are updated. This ensures the live specs are re-fetched (with the new title from `chart.chart_spec.title`) immediately after a save.

## Technical Details

**File: `src/hooks/useSavedCharts.ts`** -- in the `updateMutation.onSuccess` callback, add invalidation of the live specs query alongside the existing saved-charts invalidation:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["saved-charts"] });
  queryClient.invalidateQueries({ queryKey: ["saved-charts-live"] });
},
```

This is a one-line addition. When the update succeeds, both caches are cleared, so the Trends page re-fetches saved charts (with new title) and then re-executes DSL (reading the new title from the fresh data).

| File | Change |
|---|---|
| `src/hooks/useSavedCharts.ts` | Add `invalidateQueries(["saved-charts-live"])` to `updateMutation.onSuccess` |


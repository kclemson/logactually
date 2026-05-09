## Problem

After editing a chart's title and saving, the chart in the Trends grid keeps showing the old title until the page is pulled-to-refresh.

## Root cause

In `src/pages/Trends.tsx`, saved charts are rendered from a derived `liveSpecs` map (line 133) that re-executes the chart DSL against fresh data. The chart's title and `aiNote` are baked *into that map* at fetch time (lines 156–160):

```ts
results.set(chart.id, {
  ...freshSpec,
  title: chart.chart_spec.title,
  aiNote: chart.chart_spec.aiNote,
});
```

When the user saves a title edit, `useSavedCharts.updateMutation` invalidates both `saved-charts` and `saved-charts-live`. The `saved-charts` cache updates immediately with the new title, but `saved-charts-live` has to re-fetch all chart data (potentially slow) before the new title shows up. Until that refetch completes, the rendered chart reads the stale title from `liveSpecs`.

The pull-to-refresh "fixes" it only because it forces the live refetch to complete and rebuild the map.

## Fix

Title and `aiNote` are user-edited metadata, not values derived from chart data. They shouldn't be cached inside the data-fetch query at all. Merge them in at render time from the always-current `savedCharts` source.

### Change 1 — `src/pages/Trends.tsx` line 444

Replace:
```tsx
spec={liveSpecs?.get(chart.id) ?? chart.chart_spec}
```

With a small inline merge that overlays the saved title/aiNote on top of the live data spec:
```tsx
spec={
  liveSpecs?.get(chart.id)
    ? { ...liveSpecs.get(chart.id)!, title: chart.chart_spec.title, aiNote: chart.chart_spec.aiNote }
    : chart.chart_spec
}
```

(Or pull this into a small `useMemo`/helper for readability.)

### Change 2 — `src/pages/Trends.tsx` lines 156–160 (cleanup)

The title/aiNote overlay inside the `saved-charts-live` queryFn becomes redundant after Change 1 — remove those two lines so the cached live spec only carries data-derived fields. This avoids future drift where the cached spec disagrees with the saved metadata.

## Result

Title (and aiNote) edits show up immediately on save, because they read straight from `savedCharts` (which React Query updates synchronously via `updateMutation` invalidation). No refetch of chart data needed for metadata-only edits.

## Out of scope

- The `saved-charts-live` invalidation on update is still appropriate for edits that change the DSL (e.g. metric, grouping). Not touching that.
- No backend / RLS / DSL changes.
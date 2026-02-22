

# Pass live data to edit dialog for v2 charts

## Problem
When opening a saved v2 chart for editing, the dialog receives the stale `chart_spec` stored in the database. The Trends page itself now re-executes the DSL for live data (the fix from earlier), but the edit dialog still initializes with the old stored spec. Hitting "Regenerate" works because that triggers a fresh DSL execution.

## Solution
In `openChartForEditing` (inside `src/pages/Trends.tsx`), after fetching fresh data for verification, also run `executeDSL` to produce a refreshed `ChartSpec` and pass that to the dialog instead of the stale stored one.

## Technical Details

**File: `src/pages/Trends.tsx`** (lines 88-100)

Currently `openChartForEditing` already calls `fetchChartData` for verification purposes but discards the fresh spec. The change:

1. After `fetchChartData`, call `executeDSL(dsl, freshData)` to get a refreshed chart spec.
2. Merge saved visual overrides (title, aiNote) from the stored spec onto the fresh spec (same pattern already used by the live-specs query).
3. Pass the refreshed spec as `chartSpec` in `setEditingChart` instead of `chart.chart_spec`.

This means the `setEditingChart` call moves inside the try block (for v2 charts), so the dialog opens with live data. For v1 charts (no DSL), the stale spec continues to be used since there is no way to refresh without calling the AI.

| File | Change |
|---|---|
| `src/pages/Trends.tsx` | Re-execute DSL in `openChartForEditing` and pass fresh spec to edit dialog |


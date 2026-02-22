

# Re-execute saved chart DSL on mount for live data

## Problem
Saved/pinned charts store the full `chart_spec` (including the `data` array) in the database at save time. When the Trends page renders these charts, it passes the stored spec directly to `DynamicChart`, which just renders whatever data it receives. The tooltip and chart values are frozen from when the chart was first created -- showing stale data days or weeks old.

## Solution
For v2 saved charts (those with a stored `chart_dsl`), re-execute the DSL client-side when the Trends page mounts. This fetches fresh data from the database and runs `executeDSL` locally, replacing the stale `data` array with live values while keeping the saved title, colors, and other visual config.

v1 charts (no DSL) will continue showing their saved data since there is no lightweight way to refresh them without calling the AI again.

## Technical Details

**File: `src/pages/Trends.tsx`**

Add a new mechanism to hydrate saved v2 charts with live data:

1. Create a state map to hold refreshed chart specs keyed by chart ID: `Map<string, ChartSpec>`
2. When `savedCharts` loads (or `selectedPeriod` changes), loop through charts that have `chart_dsl`. For each one, call `fetchChartData(supabase, chartDsl, selectedPeriod)` then `executeDSL(chartDsl, freshData)` to produce an updated `ChartSpec`.
3. Store the refreshed specs in the state map.
4. When rendering `DynamicChart`, prefer the refreshed spec over the stored one: `spec={liveSpecs.get(chart.id) ?? chart.chart_spec}`

This will be implemented as a `useQuery` or a standalone async function triggered when the saved charts list and period are available. Using a query with a composite key like `["saved-charts-live", savedChartIds, selectedPeriod]` ensures automatic refresh when the period changes and avoids redundant fetches.

The refresh runs in parallel for all v2 charts using `Promise.all`, with individual error handling so one failing chart does not block others -- failed charts simply fall back to their saved spec.

**No other files need changes.** `fetchChartData` and `executeDSL` are already exported and used by the chart generation flow.

| File | Change |
|---|---|
| `src/pages/Trends.tsx` | Add live DSL re-execution for saved v2 charts on mount / period change |


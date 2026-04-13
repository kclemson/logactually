

## Refactor built-in food trends to use `fetchChartData` pipeline

### Problem
Row 2 macro charts show "avg: undefined, today: undefined" for non-standard macros (fiber, sugar, etc.) because the query (line 187) only fetches `total_calories, total_protein, total_carbs, total_fat`, and the aggregation/stats are hardcoded to those four fields.

### Approach
Replace the separate Supabase query with `fetchChartData` from `chart-data.ts`, which already parses `food_items` JSON and sums all macros per date. One codepath for all macros, no special-casing.

### Changes — single file: `src/pages/Trends.tsx`

**1. Replace food query (lines 180–195)**
Swap the current `useQuery` with a call to `fetchChartData(supabase, { source: "food", metric: "calories", groupBy: "date", chartType: "bar", title: "", aggregation: "sum" }, selectedPeriod)`. Returns `DailyTotals` with `food` record keyed by date, each value containing all macro fields.

**2. Rewrite `chartData` aggregation (lines 318–367)**
Instead of summing `total_protein`/`total_carbs`/`total_fat` from query rows, iterate over the `DailyTotals.food` record. Each `FoodDayTotals` already has `calories, protein, carbs, fat, fiber, sugar, saturated_fat, sodium`. Derive `net_carbs = Math.max(0, carbs - fiber)`. Keep the P/C/F percentage fields (proteinPct, carbsPct, fatPct) for the Macro Split and Combined charts — those always use protein/carbs/fat.

**3. Make `averages` and `todayValues` dynamic (lines 370–400)**
Compute values for `calories` plus every key in `MacroKey` (or at minimum every key in `settings.displayMacros`), so subtitle text works for any selected macro.

**4. Remove `cholesterol` from `CHART_COLORS` (line 54)**
Cleanup from prior change.

### User experience
- **Default macros (P/C/F):** No visible difference.
- **Non-default macros:** Charts show correct avg/today values instead of "undefined".
- **Macro Split (%) and Combined charts:** Always show P/C/F, unchanged.

### Architecture benefit
Single data-fetching codepath shared with custom charts. No duplicate logic, no fragile conditional branches.


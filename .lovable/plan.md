

## Dual-Series Chart Support — Comprehensive Plan

### What we're building

A "Compare" mode that lets users overlay two independent metrics on one chart. Each series can be bar or line, from food or exercise, with its own color. When scales differ significantly, a right Y-axis appears. Date-based grouping only (daily or weekly).

### 10 canonical test cases (from earlier discussion)

1. Protein (bars) vs weight training volume (line) — dual axis
2. HR on walks vs HR on runs (two lines) — shared axis
3. Daily calories (bars) vs calories burned (line) — shared axis
4. Daily carbs (bars) vs exercise duration (line) — dual axis
5. Daily fat (line) vs daily protein (line) — shared axis
6. Training volume (bars) vs sets count (line) — dual axis
7. Daily calories (line) vs exercise entry count (bars) — dual axis
8. Daily fiber (bars) vs daily sugar (bars) — shared axis, grouped side-by-side
9. Run distance (line) vs run duration (line) — dual axis
10. Weekly avg calories (line) vs weekly avg protein (line) — dual axis

### Implementation layers

**1. Database: add `chart_dsl_2` column to `saved_charts`**

```sql
ALTER TABLE saved_charts ADD COLUMN chart_dsl_2 jsonb DEFAULT NULL;
```

Nullable — `NULL` means single-series (existing behavior). When present, Trends page runs both DSLs and merges.

**2. Extend `ChartSpec` with `secondSeries`**

Add to the existing `ChartSpec` interface in `DynamicChart.tsx`:

```ts
secondSeries?: {
  dataKey: string;      // e.g. "value2"
  chartType: "bar" | "line";
  color: string;
  label: string;
  valueFormat?: "integer" | "decimal1" | "duration_mmss" | "none";
  useRightAxis: boolean;
};
```

No changes to `ChartDSL` — each series is a standalone DSL. The pairing happens at the UI/storage layer.

**3. New utility: `src/lib/chart-merge.ts`**

- Input: two `ChartSpec` objects (output of `executeDSL` for each series)
- Merges their `data` arrays by `rawDate` (or `label` for weekly) into a single array with `value` (series A) and `value2` (series B)
- Auto-determines `useRightAxis`: if `maxA / maxB > 3` or `maxB / maxA > 3`, use dual axis
- Picks Series B color from a contrasting palette:

```ts
const SERIES_B_COLORS = ["#E11D48", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
// Pick first that isn't within ΔE threshold of Series A color
```

- Returns a merged `ChartSpec` with `secondSeries` populated

**4. Update `DynamicChart.tsx` rendering**

When `spec.secondSeries` is present:

- Switch from `BarChart`/`LineChart` to Recharts `ComposedChart` (supports mixed Bar + Line)
- Add a right-side `<YAxis yAxisId="right" orientation="right" />` when `useRightAxis` is true
- Render Series A as `<Bar>` or `<Line>` with `yAxisId="left"`
- Render Series B as `<Bar>` or `<Line>` with `yAxisId` based on `useRightAxis`
- Add a compact `<Legend>` at the bottom showing both series labels with their colors
- Labels: Series A uses existing label renderer; Series B gets a matching one with its own color
- Tooltip: show both values formatted with their respective labels

**5. "Compare" mode in `CustomChartDialog.tsx`**

Add a toggle/tab at the top: "Single" | "Compare"

When "Compare" is active:
- Show two configuration rows, each with:
  - Source dropdown: Food / Exercise
  - Metric dropdown (populated from source — existing `FOOD_METRICS` / `EXERCISE_METRICS` lists)
  - Chart type toggle: Bar / Line
  - Optional: exercise key filter (for cases like "walks only" or "runs only")
- Shared controls: Period (already exists), GroupBy (date/week only)
- On submit: call `fetchChartData` + `executeDSL` for each series independently, then merge via `chart-merge.ts`, preview result
- Save stores `chart_dsl` (series A) + `chart_dsl_2` (series B)

**6. Update `useSavedCharts.ts`**

- Include `chart_dsl_2` in select, insert, update queries
- Pass through to save/update mutations

**7. Update Trends page saved chart rendering**

In `Trends.tsx` where saved charts are rendered with live DSL re-execution:
- When a saved chart has `chart_dsl_2`, run `fetchChartData` + `executeDSL` for both DSLs
- Merge results via `chart-merge.ts`
- Pass merged spec (with `secondSeries`) to `DynamicChart`

**8. Update `ChartContextMenu` for dual-series charts**

- "Edit" opens `CustomChartDialog` in Compare mode with both DSLs pre-loaded
- Verification display may need to be disabled or simplified for dual-series

### What this does NOT include (intentional scope limits)

- No AI-generated dual-series (user must manually configure both series)
- No categorical dual-series (item, dayOfWeek, etc.) — date/week only
- No more than two series
- No shared-axis override (auto-detected only)
- No changes to the `generate-chart-dsl` edge function

### File change summary

| File | Change |
|------|--------|
| `saved_charts` table | Add `chart_dsl_2 jsonb` column |
| `src/components/trends/DynamicChart.tsx` | Add `secondSeries` to `ChartSpec`, render with `ComposedChart`, dual axis, legend |
| `src/lib/chart-merge.ts` | **New** — merge two ChartSpecs by date, auto-detect axis sharing, pick contrast color |
| `src/components/CustomChartDialog.tsx` | Add Compare mode toggle, two metric picker rows, dual-series save flow |
| `src/hooks/useSavedCharts.ts` | Include `chart_dsl_2` in queries |
| `src/pages/Trends.tsx` | Handle dual-DSL re-execution for saved charts |
| `src/lib/constants.ts` | Add `SERIES_B_COLORS` palette |




## Three-Part Plan: Feature Gate, Mode Toggle, and DSL Design

### Part 1: Feature-gate the "+ Chart" button

Hide the `+ Chart` button (and the "My Charts" section) behind the existing `useIsAdmin()` hook. This way you can push to prod without exposing the chart creation UI to other users.

**What changes:**
- In `Trends.tsx`, import `useIsAdmin` and conditionally render the `+ Chart` button and the "My Charts" collapsible section only when `isAdmin` is true.
- The `CustomChartDialog` components can stay mounted (they already early-return when `open` is false), but the triggers become admin-only.

### Part 2: Mode toggle in the Create Chart dialog

Add a simple toggle at the top of `CustomChartDialog` that switches between two modes:
- **v1 ("AI generates data")** -- the current behavior, unchanged
- **v2 ("AI generates schema")** -- the new declarative approach

**What changes:**
- Add a `mode` state (`"v1" | "v2"`) to `CustomChartDialogInner`
- Render a small segmented control / toggle below the dialog title
- When `mode === "v1"`, render exactly the current flow
- When `mode === "v2"`, render a placeholder flow that:
  - Uses the same chip suggestions and textarea input
  - Calls a new `generate-chart-schema` edge function (or a `mode` param on the existing one)
  - Returns a DSL object instead of a data array
  - Executes the DSL client-side against daily totals to produce the chart data
  - Renders the result with the same `DynamicChart` component

For the initial implementation, v2 will call the existing `generate-chart` function with an additional `{ mode: "schema" }` parameter. The edge function will branch on this to use a different system prompt that returns a DSL spec instead of computed data.

### Part 3: The DSL design

The DSL is what the AI returns in v2 mode. The client interprets it deterministically.

```text
ChartDSL {
  chartType: "bar" | "line" | "area"
  title: string

  // What to measure
  source: "food" | "exercise"
  metric: string              // e.g. "cal", "protein", "duration", "sets"
  derivedMetric?: string      // e.g. "protein_pct", "net_carbs" (known formulas)

  // How to slice the x-axis
  groupBy: "date"             // one point per day
         | "dayOfWeek"        // 7 buckets (Mon-Sun)
         | "hourOfDay"        // 24 buckets (0-23)
         | "weekdayVsWeekend" // 2 buckets
         | "week"             // one point per ISO week

  // How to reduce multiple values per bucket
  aggregation: "sum" | "average" | "max" | "min" | "count"

  // Optional filters
  filter?: {
    exerciseKey?: string      // e.g. "running" -- only this exercise
    dayOfWeek?: number[]      // e.g. [1,2,3,4,5] for weekdays
  }

  // Optional second series for comparison
  compare?: {
    metric: string
    source?: "food" | "exercise"
  }

  // Sorting (for categorical charts)
  sort?: "label" | "value_asc" | "value_desc"
}
```

**Client-side engine:** A new function `executeDSL(dsl: ChartDSL, dailyTotals: DailyTotals): ChartSpec` that:
1. Reads the raw daily totals (already available -- the edge function computes these today)
2. Applies filters
3. Groups by the specified dimension
4. Applies the aggregation function
5. Returns a `ChartSpec` that `DynamicChart` already understands

This means the AI never touches the numbers. It only decides "what metric, what grouping, what chart type" -- the math is 100% deterministic on the client.

### Files to create or modify

| File | Action | Description |
|---|---|---|
| `src/pages/Trends.tsx` | Modify | Gate `+ Chart` button and My Charts behind `isAdmin` |
| `src/components/CustomChartDialog.tsx` | Modify | Add v1/v2 mode toggle, v2 flow calls DSL path |
| `src/lib/chart-dsl.ts` | Create | DSL type definition and `executeDSL()` engine |
| `src/lib/chart-dsl.test.ts` | Create | Unit tests for the DSL engine |
| `supabase/functions/generate-chart/index.ts` | Modify | Add `mode: "schema"` branch with a DSL-focused system prompt |
| `src/hooks/useGenerateChart.ts` | Modify | Pass `mode` param through to edge function |

### What stays the same
- `DynamicChart` component -- both modes produce a `ChartSpec` that it renders
- The verification system -- v1 keeps it; v2 doesn't need it (deterministic by construction)
- Saved charts persistence -- both modes save to the same `saved_charts` table
- All existing chart functionality for non-admin users is unaffected (hidden behind gate)


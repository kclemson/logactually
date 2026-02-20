
# Add rolling window support to the Chart DSL

## What this solves

When users ask for "rolling average" or "7-day average" charts (e.g. body weight, calories), the DSL currently has no way to express a windowed calculation. Instead the AI picks `aggregation: "average"` with `groupBy: "date"`, which gives raw daily values — producing the jagged line the user saw. With a `window` field, the DSL can produce genuinely smoothed trend lines.

## Schema change: add `window` to ChartDSL

```ts
// src/lib/chart-types.ts
window?: number; // trailing N-day average applied after date grouping
```

This field is only meaningful when `groupBy === "date"` or `groupBy === "week"`. It tells the executor: after aggregating raw daily values, replace each point's value with the trailing average of the last N points.

## How the rolling average is computed (chart-dsl.ts)

After the `groupBy: "date"` case builds `dataPoints`, a post-processing pass runs if `dsl.window` is set:

```ts
if (dsl.window && dsl.window > 1 && dsl.groupBy === "date") {
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - dsl.window + 1);
    const slice = dataPoints.slice(start, i + 1).map(p => p.value);
    dataPoints[i].value = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
}
```

This is a simple trailing window — no dependencies, no new data fetching. It works on the already-aggregated `dateValues` array that `fetchChartData` already produces. The first N-1 points use a shorter window (partial average) which is standard behavior for rolling averages at the start of a series.

## System prompt update (generate-chart-dsl/index.ts)

Add `window` to the DSL JSON schema block shown to the AI, and a brief explanation in the GROUP BY OPTIONS section:

```
"window": <positive integer, or null> — only valid when groupBy is "date" or "week". 
Applies a trailing N-day rolling average to the data points. Use when the user 
says "rolling average", "7-day average", "smoothed", "trend line", or similar.
```

This is a purely mechanical, unambiguous instruction — the AI sees `window: 7` means "trailing 7-day average". No semantic reasoning required.

## What changes

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `window?: number` to `ChartDSL` interface |
| `src/lib/chart-dsl.ts` | Add post-processing pass after `groupBy: "date"` and `groupBy: "week"` cases that applies the trailing window average |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `window` field to the JSON schema block and a one-line description in the GROUP BY section |

No changes to `chart-data.ts` (data fetching is unchanged), `DynamicChart`, or `useGenerateChart`. Saved charts that have no `window` field continue to work exactly as before (undefined = no windowing).

## Example DSL the AI would now produce

For "7-day rolling average of my weight" (which would come through as a custom log chart once that's built, but for now would apply to food calories, protein, etc.):

```json
{
  "chartType": "line",
  "title": "7-Day Rolling Average Calories",
  "source": "food",
  "metric": "calories",
  "groupBy": "date",
  "aggregation": "sum",
  "window": 7,
  "aiNote": "Trailing 7-day average of daily calories"
}
```

## What this enables immediately

- "7-day rolling average protein" → smooth line instead of jagged daily bars
- "Rolling calorie trend over 90 days" → immediately useful for seeing macro trends
- "Smoothed exercise duration" → filters out missed days / outlier sessions
- Body weight custom log (once `source: "custom_log"` is added) — this is the most compelling use case

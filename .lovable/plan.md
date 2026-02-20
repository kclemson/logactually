
# Add `transform: "cumulative"` to the Chart DSL

## What this solves

Users often want "total to date" views — cumulative miles run this month, cumulative calories logged this week, total sets completed so far. Currently the DSL can only show per-period values (daily/weekly bars or lines). A cumulative transform turns any time-series into a running total, which is a completely different and useful lens on the same data.

## Why this one next

It follows the exact same pattern as `window` — a pure post-processing pass in `executeDSL` after the `groupBy: "date"` or `"week"` cases build `dataPoints`. Zero new data fetching, zero new Supabase queries, zero changes to `DynamicChart`. The only risk is the system prompt update in the edge function.

The three larger extensions — `compare` (dual-series), `source: "custom_log"`, and target overlays — are each meaningfully bigger:
- `compare` needs a second data series returned from `executeDSL`, a second key in `ChartSpec`, and `DynamicChart` rendering two lines/bars.
- `source: "custom_log"` needs the edge function to query the user's custom log types at request time and inject them into the prompt, plus a new fetch branch in `chart-data.ts`.

Cumulative closes out the "post-processing transforms" category cleanly before we move into the harder structural work.

## Schema change

```ts
// src/lib/chart-types.ts
transform?: "cumulative";  // prefix-sum applied after groupBy aggregation
```

Only valid with `groupBy: "date"` or `"week"` (same constraint as `window`). Can be combined with `window` — e.g. a 7-day rolling average that is also cumulative would be unusual, but the execution order is: aggregate → apply window → apply cumulative.

## Execution logic (chart-dsl.ts)

After the window pass (if any), one more post-processing block:

```ts
if (dsl.transform === "cumulative") {
  let running = 0;
  for (const point of dataPoints) {
    running += point.value;
    point.value = running;
  }
}
```

Six lines. No branching complexity. Works on both the `date` and `week` groupBy cases identically since both produce flat `dataPoints` arrays by that point.

## System prompt update (generate-chart-dsl/index.ts)

Add `transform` to the JSON schema block:

```
"transform": "cumulative" or null
```

And a section after the ROLLING WINDOW block:

```
CUMULATIVE TRANSFORM:
- "transform": "cumulative" or null — ONLY valid when groupBy is "date" or "week". 
  Converts each point to a running total (prefix sum). Use when the user says 
  "cumulative", "total so far", "running total", "to date", or similar.
  Example: "total miles run this month so far" → groupBy="date", metric="distance_miles", 
  transform="cumulative". Do NOT combine with window (rolling average and cumulative 
  total are contradictory intents).
```

## What changes

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `transform?: "cumulative"` to `ChartDSL` interface |
| `src/lib/chart-dsl.ts` | Add prefix-sum pass after the window pass in the `date` and `week` groupBy cases |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `transform` to the JSON schema block; add CUMULATIVE TRANSFORM instruction section |

## What this enables immediately

- "Cumulative calories this week" → running total line that climbs from Monday to Sunday
- "Total miles run this month so far" → shows progress toward a distance goal
- "Cumulative protein logged over 30 days" → useful for tracking adherence trends
- "Total sets completed this month" → strength volume to date

Saved charts with no `transform` field continue to work exactly as before (undefined = no transform).

## Sequencing note

After this lands, the recommended next steps in order of value vs. complexity:

1. **`source: "custom_log"`** — highest user impact (body weight charts), medium complexity
2. **`compare` (dual-series)** — medium impact, touches more files (`chart-data.ts`, `ChartSpec`, `DynamicChart`)
3. **Goal/target line overlay** — low complexity (a horizontal reference line in `DynamicChart`), useful for "show my calorie target on the chart"

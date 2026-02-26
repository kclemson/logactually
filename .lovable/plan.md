

## Problem: Cardio Distance Trend shows flat "2, 2, 2..."

The chart is technically working — it's fetching real data — but two bugs make it appear broken:

### Bug 1: All values rounded to integers
Every data point goes through `Math.round()` in the DSL engine (line 190 of `chart-dsl.ts`), and again in `applyWindow` (line 127). Distances like 2.1, 2.4, 1.8 miles all become `2`. The rolling average of `[2, 2, 2, 2, 2, 2, 2]` is... `2`. Hence the flat line.

The `valueFormat` field is never set by `executeDSL`, so the chart renderer defaults to `"integer"` format, reinforcing the rounding.

### Bug 2: Rolling window counts data points, not calendar days
`applyWindow` averages the previous N *data points*, not N *calendar days*. If you exercised 10 times over 90 days, "window: 7" averages data points 1-7 (which might span 60 calendar days), not the last 7 calendar days. For sparse exercise data, this makes the rolling average meaningless.

### Fix

**File: `src/lib/chart-dsl.ts`**

1. **Stop rounding decimal metrics** — Create a set of metrics that need decimal precision (`distance_miles`). In the `date` groupBy branch (line 190), skip `Math.round` for these metrics. Same in `applyWindow` (line 127).

2. **Set `valueFormat: "decimal1"`** — After building the ChartSpec (around line 546), detect when the metric is `distance_miles` and set `valueFormat: "decimal1"` so the chart renderer formats labels as `2.4` not `2`.

3. **Calendar-aware rolling window for date groupBy** — When `groupBy === "date"`, fill in zero-value entries for missing calendar days *before* applying the window. This ensures "window: 7" means "7 calendar days" not "7 data points". After the window pass, strip out the zero-only filler days to keep the chart clean.

```text
Before (sparse data, window:7):
  Data points:  [Jan 5: 2.4] [Jan 12: 1.8] [Jan 20: 3.1]
  Window avg:   [2.4]        [2.1]          [2.43]
  (averages across weeks — meaningless)

After (calendar-filled, window:7):
  Filled:       [Jan 5: 2.4] [Jan 6: 0] ... [Jan 11: 0] [Jan 12: 1.8] ...
  Window avg:   [0.34]       [0.34]     ... [0.26]       [0.6]         ...
  (true 7-day rolling average — shows actual weekly trend)
```

### Specific line changes

| File | Lines | Change |
|------|-------|--------|
| `src/lib/chart-dsl.ts` | ~19 | Add `DECIMAL_METRICS` set: `new Set(["distance_miles"])` |
| `src/lib/chart-dsl.ts` | 122-128 | `applyWindow`: skip `Math.round` when values are decimal |
| `src/lib/chart-dsl.ts` | 173-203 | `date` groupBy: fill calendar gaps before window; don't round decimal metrics |
| `src/lib/chart-dsl.ts` | 546-557 | Set `valueFormat: "decimal1"` when metric is in `DECIMAL_METRICS` |

This will make the cardio distance trend show meaningful values like `0.3`, `0.5`, `1.2` representing the true 7-day rolling average of daily miles, with proper decimal formatting on the chart labels.


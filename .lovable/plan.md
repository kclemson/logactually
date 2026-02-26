

## Problem: Rolling heart rate average diluted by zero-fill days

The recent calendar-aware window fix (for distance_miles) has a side effect on intensity metrics like heart_rate. When you run 3 out of 7 days at ~160 bpm, the engine fills the other 4 days with 0, producing a 7-day average of ~69-95 instead of ~160.

**Root cause**: The calendar gap fill treats all metrics the same — inserting 0 for missing days. This is correct for "volume" metrics (distance, duration, calories) where 0 means "none that day", but wrong for "intensity" metrics (heart_rate, effort, speed, cadence, incline) where 0 means "no data" and should be excluded from averaging.

### Fix

**File: `src/lib/chart-dsl.ts`**

Define an `INTENSITY_METRICS` set for metrics where zero represents "no data" rather than "zero activity":

```text
INTENSITY_METRICS = { heart_rate, effort, speed_mph, cadence_rpm, incline_pct }
```

For these metrics, skip the calendar gap filling and use the original point-based window behavior (average the last N data points, not N calendar days). This means "7-day rolling average of heart rate" correctly averages your last 7 running sessions' heart rates.

| Area | Change |
|------|--------|
| `src/lib/chart-dsl.ts` ~line 19 | Add `INTENSITY_METRICS` set |
| `src/lib/chart-dsl.ts` ~line 208 | Skip calendar gap filling when metric is in `INTENSITY_METRICS` — fall through to the existing `applyWindow` call which uses point-based averaging |

This is a ~3-line change: add the set, add one condition to the existing `if (dsl.window && ...)` block.

### Expected result

The "Running Heart Rate (7d Avg)" chart will show values in the 150-165 range, correctly averaging only the sessions where heart rate was recorded.


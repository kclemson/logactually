Stop treating unlogged food days as zero-protein/zero-calorie days in rolling averages. The rolling window should average only days with actual data over the trailing N-day calendar window.

## The bug

In `src/lib/chart-dsl.ts` around line 292, when `dsl.window > 1`, the engine calendar-fills every gap with `{ value: 0 }` and runs `applyWindow` over the filled array. For exercise that's correct (a rest day is genuinely 0 volume / 0 calories burned). For **food**, an unlogged day means "no data," not "ate nothing" — so zeros drag the rolling average down. Hence the March dip in your chart on days you didn't log.

## Fix

Two coordinated changes, both in `src/lib/chart-dsl.ts`:

**1. Mark calendar-fill days as null instead of 0** (only for the food branch — leave exercise zero-fill alone):

```ts
filled.push({
  rawDate: ds,
  label: format(cur, "MMM d"),
  value: dsl.source === "food" ? null : 0,  // null = "no data"
  _details: [],
  _calendarFill: true,
});
```

**2. Update `applyWindow` to skip nulls in the divisor**:

```ts
function applyWindow(dataPoints, window, useDecimal = false) {
  const raw = dataPoints.map((p) => p.value);
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = raw.slice(start, i + 1).filter((v) => v !== null && !Number.isNaN(v));
    if (slice.length === 0) {
      dataPoints[i].value = null;  // no data at all in window
      continue;
    }
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    dataPoints[i].value = useDecimal ? Math.round(avg * 10) / 10 : Math.round(avg);
  }
}
```

The existing `dataPoints = filled.filter(p => !p._calendarFill)` line already strips the calendar-fill markers from the rendered output, so days you didn't log still won't show points on the chart — they just no longer poison the average for nearby days.

## Semantics this matches

This is the same "sum of logged values / count of logged days within the trailing 7 calendar days" that the built-in 7-day protein chart uses. So the rolling average will now agree with the built-in chart at any endpoint, instead of only when you've logged every day.

## Scope

- Food rolling charts: March dip flattens out — those days will reflect the average of *what you actually ate* in the surrounding logged days.
- Exercise rolling charts: unchanged (zeros stay, since a rest day is real data).
- Intensity metrics (heart_rate, effort): already skip calendar-fill — unchanged.
- Cumulative transform: unaffected (runs separately).

## Verification

Reopen the Rolling 7-Day Protein chart, 90-day view. The March dip to ~5 should disappear and the line should sit smoothly in your normal range during that gap. May 9 endpoint should remain ~126 (matching the previous fix).
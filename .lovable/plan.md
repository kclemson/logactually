Fix the rolling-average bug in `src/lib/chart-dsl.ts` `applyWindow` (the function used by every "rolling N-day" chart).

## The bug

```ts
function applyWindow(dataPoints, window) {
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = dataPoints.slice(start, i + 1).map((p) => p.value);  // ← reads mutated values
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    dataPoints[i].value = ...avg;
  }
}
```

It mutates `dataPoints[i].value` in place, then index `i+1` reads `p.value` from those already-mutated entries. Each rolling average is computed from previously-averaged predecessors, not raw values — accidental exponential smoothing.

Verified against the user's real data: a true 7-day trailing average on May 9 should be **126** (matches the built-in 7-day chart's avg of 121). The buggy code produces **102**, and once calendar-fill zeros from March missing-log days are folded in it drops further to **~96** — exactly what the chart shows.

## Fix

Snapshot raw values once, then write averages out:

```ts
function applyWindow(dataPoints, window, useDecimal = false) {
  const raw = dataPoints.map((p) => p.value);
  for (let i = 0; i < dataPoints.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = raw.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    dataPoints[i].value = useDecimal ? Math.round(avg * 10) / 10 : Math.round(avg);
  }
}
```

One-line conceptual change; same signature; no callsite churn.

## Scope of impact

`applyWindow` is called from three places (lines 312, 316, 418): date-grouped rolling, week-grouped rolling, and the catch-all branch. All three benefit from the same fix. Every saved chart with `window > 1` (food and exercise alike) will recompute correctly on next render — no migration needed.

The earlier "zero-fill for unlogged food days" theory turned out to be wrong; that branch is fine and I'm not touching it.

## Verification

After the fix, re-open the Rolling 7-Day Protein Average chart (90-day view). May 9 endpoint should jump from ~96 to ~126, and the line shape over the last week should rise sharply — matching what the built-in protein chart already shows.
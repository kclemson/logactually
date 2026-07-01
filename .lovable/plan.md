## Problem

The bloodwork y-axis now starts at 0 (good), but its **top tick is an ugly decimal** — e.g. `299.16` on Iron, `51.84` on Iron Saturation, `577.8` on TIBC, `17.928` on a smaller analyte. This is because the axis max is computed as `max × 1.08`, which produces arbitrary decimals that Recharts then prints as the top tick.

## Fix

In `src/components/trends/DynamicChart.tsx`, replace the raw padded max with a **"nice" rounded top** so the axis ends on a clean number (300, 40, 400, 20, etc.) while still:
- starting at 0,
- enclosing the top of the reference range,
- leaving a little headroom above the highest reading.

Add a small helper that rounds a value up to a clean step (1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10 × the appropriate power of 10):

```text
niceTop(v):
  if v <= 0 -> return 1
  exp  = floor(log10(v))
  base = 10^exp
  for step in [1,1.2,1.5,2,2.5,3,4,5,6,8,10]:
     if v <= step*base -> return step*base
  return 10*base
```

Then compute the bloodwork domain as:

```text
dataMax = max(numeric values)
refHigh = spec.referenceRange.high (when present)
top     = niceTop( max(dataMax, refHigh) )
domain  = [0, top]
```

Examples with your data: Iron 277 → top 300; Iron Saturation 38 → top 40; TIBC 364 → top 400; a ~16.6 analyte → top 20; creatinine ~1.2 → top 1.5 (stays tight for small-valued analytes). Recharts then generates clean interior ticks (e.g. 0 / 75 / 150 / 225 / 300), and no decimal like `299.16` appears.

## Technical detail

- Only the `isBloodwork` single-series branch changes; swap the current `bloodworkYDomain` computation (which pads by `× 1.08`) for the `niceTop`-based one above. The `domain={bloodworkYDomain}` usage on the YAxis stays the same.
- Keep Recharts' default `allowDecimals` so small-range analytes (e.g. creatinine 0–1.5) still get sensible half-step ticks; large analytes round to whole numbers naturally.
- No backend, DSL, or data changes — pure presentation. Applies to both pinned bloodwork charts and the analyte trend popover.

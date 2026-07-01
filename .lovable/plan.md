## Goal

Make the recommended (reference) range band always fully visible on bloodwork trend charts. Today the y-axis is fitted to `["dataMin", "dataMax"]`, so when your values sit above (or tightly within) the normal range, the lower part of the shaded band gets clipped off the bottom.

## The change

In `src/components/trends/DynamicChart.tsx`, change the bloodwork y-axis to **start at 0** and extend the top to include both the highest reading and the top of the reference band, with a little padding.

New domain logic (bloodwork line charts only):

```text
values      = all numeric points for the analyte
dataMax     = max(values)
refHigh     = spec.referenceRange.high  (when present)

high   = max(dataMax, refHigh ?? dataMax)
pad    = high * 0.08   (small headroom so the top isn't glued to the edge)
domain = [0, high + pad]
```

Effect:
- Axis always starts at 0, so the entire shaded normal range (which is always above 0) is visible with context below it.
- Top of the axis stretches to fit the highest reading and the top of the band.
- Non-bloodwork charts are untouched — this only changes the `isBloodwork` YAxis branch.

This applies everywhere bloodwork charts render through `DynamicChart` — the pinned charts on the Custom page and the analyte trend popover (both use the same component).

## Technical detail

- Only the single-series bloodwork branch at `DynamicChart.tsx:455` changes; swap `domain={["dataMin", "dataMax"]}` for `domain={[0, computedHigh]}` computed from `data`, `dataKey`, and `spec.referenceRange`.
- The `<ReferenceArea>` element stays as-is; the domain now guarantees the band fits.
- No backend, DSL, or data changes — pure presentation.

## Tradeoff to keep in mind

Anchoring at 0 means analytes whose values sit far from 0 will show a flatter line, so small fluctuations look smaller. This is the simpler, more intuitive behavior and keeps the reference band clearly framed. If any specific chart later feels too flat, we can revisit padding the bottom instead.

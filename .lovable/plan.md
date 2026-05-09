## Hide the "Total Volume" chart on the Trends page

### Change
In `src/pages/Trends.tsx` (around lines 706–715), remove the `<VolumeChart>` block from the exercise charts grid. The chart sits inside a `grid grid-cols-2 gap-2` alongside the Estimated Exercise Calorie Burn chart and the per-exercise charts.

### Layout safety
The container uses CSS grid with `grid-cols-2`, so cells reflow automatically when one is removed:
- Calorie Burn chart shifts into the first cell
- Per-exercise charts fill the remaining cells in order
- No empty slots, no fixed-position assumptions, no sibling component depends on the volume chart

### Cleanup (optional, kept minimal)
Also remove the now-unused pieces tied solely to that chart to avoid dead code:
- `volumeByDay` useMemo block (Trends.tsx ~233–256)
- `VolumeChart` import from `@/components/trends/FoodChart`
- `trainingVolume` entry in `CHART_COLORS`

The `volume` field on `useWeightTrends` data points stays — it's pre-calculated upstream and harmless to keep in case we re-enable later.

No other files need changes.
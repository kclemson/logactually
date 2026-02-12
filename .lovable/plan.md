

## Fix Calorie Burn Chart Bar Visibility

The YAxis domain change alone doesn't work because Recharts stacked bars always accumulate from 0. The transparent `base` bar still goes from 0 to `low` (e.g., 130), consuming most of the chart height and leaving the visible `band` as a sliver.

### Solution

Subtract the computed `yMin` from each data point's `base` value so the transparent portion is shorter. The visible `band` stays the same, but it now sits much closer to the bottom of the chart, making height differences clearly visible.

### Changes

**File: `src/components/trends/CalorieBurnChart.tsx`**

Transform the incoming `chartData` to adjust `base` values relative to `yMin`:

```tsx
const adjustedData = useMemo(() => {
  return chartData.map(d => ({
    ...d,
    base: d.base - yMin,
  }));
}, [chartData, yMin]);
```

Then use `adjustedData` instead of `chartData` as the `data` prop on `<BarChart>`. The tooltip and click handlers still reference the original `chartData` array (via index) so the displayed values remain correct.

Update the YAxis domain to `[0, 'dataMax + 20']` since the data is now pre-adjusted (or simply remove the custom domain).

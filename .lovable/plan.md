
## Add value labels to line charts in DynamicChart

### Problem

The `labelRenderer` function in `DynamicChart.tsx` is designed for bar charts — it reads `x`, `y`, and `width` (rect-based geometry from Recharts' `Bar`). A `Line` + `LabelList` combination provides `cx`/`cy` (centre-point of each dot) instead. Currently the `LabelList` is only attached to the `Bar` element and the line chart branch has no labels at all, as visible in the screenshot.

### Solution

The fix is entirely self-contained in `DynamicChart.tsx` — no other files need to change. The approach reuses the same `_showLabel` flag, `formatValue` helper, and `labelInterval` logic already in place.

**1. Split `labelRenderer` into two specialised renderers — both private to the component**

- **`barLabelRenderer`** — identical to the current `labelRenderer`; uses `x + width/2` and `y - 4`
- **`lineLabelRenderer`** — uses `cx` and `cy - 6`; skips rendering when the value would be zero/null so sparse line charts (e.g. fiber with missing days) don't clutter the baseline

Both renderers:
- Check `chartData[index]?._showLabel` to respect the same thinning interval
- Call `formatValue(value, valueFormat)` for consistent number formatting
- Use the same `fill={color}`, `fontSize={7}`, `fontWeight={500}` styling

**2. Attach `LabelList` to the `Line` element**

```tsx
<Line ...>
  <LabelList dataKey={dataKey} content={lineLabelRenderer} />
</Line>
```

**3. Increase `LineChart` top margin from 12 → 16** to match the bar chart, giving labels room above the topmost dot (currently they would clip).

### Why this is already future-proof for built-in charts

The request notes that all built-in charts will eventually migrate to `DynamicChart`. Because the label logic lives entirely inside the shared component (driven by `ChartSpec.chartType`), any chart migrated to use `DynamicChart` with `chartType: "line"` will automatically get the same label behaviour — no per-chart changes needed.

### What stays the same

- `_showLabel` thinning interval — unchanged, same `getLabelInterval` call
- Touch tooltip/dismiss behaviour — unaffected
- Bar chart labels — untouched (the `barLabelRenderer` is just a renamed copy of the current code)
- `ChartSpec` type — no new fields required

### File changed

Only `src/components/trends/DynamicChart.tsx` — roughly 15 lines added/changed.

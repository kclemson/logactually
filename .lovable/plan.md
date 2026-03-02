

## Fix: negative bar labels overlapping bars

The issue is that for negative bars, Recharts may set `y` at the bar's bottom tip (not the zero line), making `y - 4` position the label deep inside or below the bar. The fix is to use `height` to always find the topmost edge of the bar.

### Change in `src/components/trends/DynamicChart.tsx`

- **`barLabelRenderer`** (line 113): Re-add `height` to destructuring
- **`barLabelRenderer`** (line 119): Change `y={y - 4}` to `y={Math.min(y, y + height) - 4}`
  - For positive bars: `y` is bar top, `height` positive → `Math.min = y` → same as before
  - For negative bars: regardless of how Recharts reports `y`/`height`, this always picks the edge closest to zero (the higher pixel position) and places the label 4px above it

One-line change plus re-adding `height` to destructuring. Line renderer stays unchanged since line dots have a single `y` at the data point.


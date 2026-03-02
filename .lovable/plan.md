

## Fix bar/line labels for negative values

The label renderers always position text at `y - 4` (above the bar top). For negative values, the bar grows downward from the zero line, so `y` is at the zero line and the label overlaps or sits above it instead of below the bar.

### Change

**`src/components/trends/DynamicChart.tsx`**

- **`barLabelRenderer`** (line 119): Check if `value < 0`. If so, position at `y + height + 10` (below the bar bottom) instead of `y - 4`.
- **`lineLabelRenderer`** (line 139): Check if `value < 0`. If so, position at `y + 14` (below the dot) instead of `y - 4`.

This is a two-line change — add a conditional for the `y` coordinate in each renderer based on the sign of `value`.


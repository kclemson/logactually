

## Fix: revert negative-value label positioning

The original `y - 4` is correct for **both** positive and negative bars because:
- SVG y-axis is inverted (0 = top, increasing = downward)
- `y - 4` = 4px **above** the bar top
- For negative bars, Recharts sets `y` at the zero line, so `y - 4` = above zero line ✓

The previous change (`y + height + 10`) pushed labels below the bar bottom, off the visible area.

### Changes in `src/components/trends/DynamicChart.tsx`

- **`barLabelRenderer`** (~line 120): Revert to `y={y - 4}` for all values, remove `height` destructure
- **`lineLabelRenderer`** (~line 139): Revert to `y={y - 4}` for all values

This is a straight revert of the last diff.


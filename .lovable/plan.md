

## Use existing color variable for Calorie Burn chart + title/subtitle updates

### Changes

**`src/pages/Trends.tsx`**
1. Change `CHART_COLORS.calorieBurn` from `"#F59E0B"` to reference `CHART_COLORS.calories` (or just set it to `"#2563EB"` since these are simple string constants in an object literal -- either way, single source of truth via the same object)
2. Change the title from `"Est. Calorie Burn"` to `"Estimated Calorie Burn"`
3. Change the VolumeChart subtitle from `"All exercises"` to `"Across weight exercises"`

**`src/components/trends/CalorieBurnChart.tsx`**
- The tooltip hardcodes `color: "#F59E0B"` for the range text. Instead of hardcoding a new color, pass the `color` prop (which already comes in from the parent) into the tooltip. This way the tooltip automatically uses whatever color the chart uses -- no duplication at all.

### Result
- Only one place defines the blue color (`CHART_COLORS.calories`)
- The calorie burn chart reuses it via `CHART_COLORS.calorieBurn`
- The tooltip gets the color from the prop, so no hardcoded hex values in CalorieBurnChart

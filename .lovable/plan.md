

# Remove "Total" from calorie target tooltip

## What changes
Remove the redundant "Total" header from the tooltip shown when hovering over the total calorie cell in the food log table, matching the pattern already used by the rollup tooltip (which has no title header).

## Technical details

### `src/components/FoodItemsTable.tsx` (~line 224)
- Change `label="Total"` to `label=""`

### `src/components/CalorieTargetTooltipContent.tsx` (lines 25 and 66)
- Wrap both `<div className="font-medium">{label}</div>` renders with `{label && ...}` so an empty string produces no output (no empty div either)

This matches the existing rollup tooltip pattern shown in the screenshot, which displays the legend and equation without any title header.

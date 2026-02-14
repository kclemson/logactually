

## Add Text Labels and Numeric Values on Grouped Bar Columns

For `text_numeric` custom trends (like Measurement), each grouped bar will show two labels above the column:
1. The **numeric value** (e.g., "17") in the bar's teal color, positioned just above the bar
2. The **text label** (e.g., "arm") rotated -90 degrees above the numeric value, also in the bar's teal color

### Approach

Since `StackedMacroChart` already supports per-bar `LabelList` rendering, we'll add custom label renderers specifically for grouped mode. Each bar in grouped mode will get its own `LabelList` with a custom SVG renderer that draws both the rotated text name and the numeric value.

### Technical Details

**File: `src/components/trends/FoodChart.tsx`**

1. **Create a new custom label renderer** (`createGroupedBarLabelRenderer`) that renders two `<text>` elements per bar:
   - A numeric value label (e.g., "17") positioned ~4px above the bar top, horizontal, in the bar's color
   - A rotated text label (e.g., "arm") positioned above the numeric value, rotated -90 degrees, in the bar's color

```tsx
const createGroupedBarLabelRenderer = (
  barName: string,
  color: string,
) => (props: any) => {
  const { x, y, width, value } = props;
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  const cx = x + width / 2;
  return (
    <g>
      {/* Numeric value just above bar */}
      <text x={cx} y={y - 4} fill={color} textAnchor="middle" fontSize={7} fontWeight={500}>
        {Math.round(value)}
      </text>
      {/* Rotated text label above the numeric value */}
      <text x={cx} y={y - 14} fill={color} textAnchor="start" fontSize={7} fontWeight={500}
        transform={`rotate(-90, ${cx}, ${y - 14})`}>
        {barName}
      </text>
    </g>
  );
};
```

2. **In the `StackedMacroChart` Bar rendering** (line ~383-405), when `grouped` is true, attach a `LabelList` to every bar (not just the top one) using the new renderer:

```tsx
{bars.map((bar, idx) => (
  <Bar key={bar.dataKey} ...>
    {grouped && (
      <LabelList
        dataKey={bar.dataKey}
        content={createGroupedBarLabelRenderer(bar.name, bar.color)}
      />
    )}
    {/* existing isTop label logic unchanged */}
  </Bar>
))}
```

3. **Increase top margin** when `grouped` is true to make room for the rotated text labels. Update the margin calculation (line ~330):

```tsx
margin={{
  top: grouped ? 40 : (labelDataKey ? getFoodChartMarginTop(chartData.length) : 4),
  ...
}}
```

4. **Increase chart height** for grouped charts. In `CustomLogTrendChart` in `Trends.tsx`, pass `height="h-32"` to `StackedMacroChart` when rendering multi-series grouped charts, giving more vertical room for the labels.

**File: `src/pages/Trends.tsx`** (line ~480)

Add `height="h-32"` to the `StackedMacroChart` call for multi-series custom trends:

```tsx
<StackedMacroChart
  title={trend.logTypeName}
  chartData={chartData}
  bars={bars}
  onNavigate={onNavigate}
  formatter={(value, name) => `${name}: ${value}`}
  grouped
  height="h-32"
/>
```


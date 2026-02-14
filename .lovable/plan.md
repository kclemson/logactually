
## Fix Text Label Position Inside Grouped Bars

The rotated text labels ("waist", "arm") are appearing over the X-axis instead of inside the bars. The bug is in the anchor point and text-anchor combination in `createGroupedBarLabelRenderer`.

### Root Cause

The current code places the text at `y + barHeight - 4` (near the bar's bottom edge, which is right at the X-axis) and uses `textAnchor="end"`, which makes the text extend further downward past the axis.

### Fix (`src/components/trends/FoodChart.tsx`, lines 29-33)

Change the text positioning so it starts from inside the bar and grows upward:

- Move the anchor point up slightly: `y + barHeight - 6` 
- Use `textAnchor="start"` so the rotated text extends upward (toward the top of the bar) rather than downward

```tsx
{barHeight > 14 && (
  <text x={cx} y={y + barHeight - 6} fill="white" textAnchor="start" fontSize={7} fontWeight={500}
    transform={`rotate(-90, ${cx}, ${y + barHeight - 6})`}>
    {barName}
  </text>
)}
```

With `-90` rotation and `textAnchor="start"`, the text origin is near the bottom of the bar and the characters flow upward visually, keeping the label fully inside the bar column.

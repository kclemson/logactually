

## Add Column Labels to Food Trend Charts

### Overview

Add value labels above each bar in the Calories, Protein, Carbs, and Fat charts, following the same interval-based display logic used in the weight charts to prevent overcrowding.

---

### Pattern Reference (from ExerciseChart)

The weight charts calculate label visibility like this:
```typescript
const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;
// Show label on interval OR always on last column
showLabel: index % labelInterval === 0 || index === dataLength - 1
```

---

### Implementation

#### 1. Create a Shared Label Renderer Factory

Add a helper function that creates label renderers with:
- The chart data (to check `showLabel`)
- The label color (matching the bar color)

```typescript
// Helper to create food chart label renderer with interval-based visibility
const createFoodLabelRenderer = (
  chartData: Array<{ showLabel: boolean }>,
  color: string
) => (props: any) => {
  const { x, y, width, value, index } = props;
  
  const dataPoint = chartData[index];
  if (!dataPoint?.showLabel) return null;
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 4}
      fill={color}
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {Math.round(value)}
    </text>
  );
};
```

#### 2. Update chartData to Include showLabel

Modify the `chartData` useMemo (around line 285) to add `showLabel` for each data point:

```typescript
const chartData = useMemo(() => {
  const byDate: Record<string, { ... }> = {};
  
  // ... existing aggregation logic ...
  
  const data = Object.entries(byDate).map(...);
  
  // Add showLabel based on interval
  const dataLength = data.length;
  const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;
  
  return data.map((d, index) => ({
    ...d,
    showLabel: index % labelInterval === 0 || index === dataLength - 1,
  }));
}, [entries]);
```

#### 3. Update Chart Margins

Change `margin={{ top: 4, ... }}` to `margin={{ top: 12, ... }}` on all food charts to make room for labels above bars.

#### 4. Add LabelList to Each Food Bar Chart

**Calories Chart** (line ~409):
```tsx
<Bar dataKey="calories" fill="#0033CC" radius={[2, 2, 0, 0]}>
  <LabelList 
    dataKey="calories" 
    content={createFoodLabelRenderer(chartData, CHART_COLORS.calories)} 
  />
</Bar>
```

**Protein Chart** (within the map, line ~478):
```tsx
<Bar dataKey={key} fill={color} radius={[2, 2, 0, 0]}>
  <LabelList 
    dataKey={key} 
    content={createFoodLabelRenderer(chartData, color)} 
  />
</Bar>
```

Same pattern for Carbs and Fat (they share the `.map()` loop).

---

### File Changes Summary

| Location | Change |
|----------|--------|
| ~Line 29 | Add `createFoodLabelRenderer` helper function |
| ~Line 299 | Add `showLabel` calculation to `chartData` useMemo |
| ~Line 399 | Change Calories chart margin to `top: 12` |
| ~Line 409 | Add `<LabelList>` to Calories bar |
| ~Line 424 | Change Macro Split chart margin to `top: 12` (optional, stacked chart) |
| ~Line 464 | Change Protein/Carbs/Fat charts margin to `top: 12` |
| ~Line 478 | Add `<LabelList>` to macro bars |

---

### Expected Result

| Chart | Label Format | Color |
|-------|--------------|-------|
| Calories | `2150` | Deep blue (#0033CC) |
| Protein | `145` | Teal (#115E83) |
| Carbs | `220` | Cyan (#00B4D8) |
| Fat | `85` | Light blue (#90E0EF) |

Labels will be:
- Font size 7px (matching weight charts)
- Positioned 4px above each bar
- Shown every column when ≤12 data points
- Shown every 2nd column when 13-20 data points
- Shown every 3rd column when >20 data points
- Always shown on the last column


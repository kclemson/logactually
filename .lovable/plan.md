

## Improve Calorie Burn Chart Y-Axis to Better Show Bar Heights

Currently the Y-axis starts at 0, which makes the floating calorie-burn bands look like thin slivers (as seen in the screenshot). By setting the Y-axis minimum to roughly `min(low) - 50`, the bars will have visible height differences while still accurately representing the range.

### Changes

**File: `src/components/trends/CalorieBurnChart.tsx`**

1. Compute the Y-axis floor from the chart data:
   - Find the minimum `low` value across all data points
   - Subtract 50 and floor to nearest 50 (e.g., min low of 180 becomes 100; min low of 310 becomes 250)
   - Use this as the Y-axis domain minimum

2. Add a hidden `<YAxis>` component with `domain={[yMin, 'auto']}` and `hide` to control the scale without showing axis labels (keeping the compact layout)

3. Update the `base` values: Since the Y-axis no longer starts at 0, the transparent base bar values stay as-is -- Recharts will handle the domain shift. However, since stacked bars always render from 0, the cleaner approach is to adjust the `base` values by subtracting `yMin` from each, and set the YAxis domain to `[0, 'auto']` offset. Actually, the simplest correct approach: just set a YAxis with `domain={[yMin, 'dataMax']}` and Recharts will clip the bars at the floor.

### Technical Detail

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Inside the component:
const yMin = useMemo(() => {
  if (chartData.length === 0) return 0;
  const minLow = Math.min(...chartData.map(d => d.low));
  return Math.max(0, Math.floor((minLow - 50) / 50) * 50);
}, [chartData]);

// In the BarChart:
<YAxis domain={[yMin, 'dataMax + 20']} hide />
```

This adds a `YAxis` (hidden, so no visual clutter) that shifts the bottom of the scale up, making the calorie burn bands visually prominent. The `dataMax + 20` gives a small top padding. The floor is clamped to 0 minimum and rounded to nearest 50 for clean scaling.


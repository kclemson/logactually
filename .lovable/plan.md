

## Fix Chart Alignment and Macros Stacking Order

### Overview
Two fixes:
1. Remove the left indentation of charts relative to their titles by hiding the YAxis
2. Reorder the stacked bars in Macros (%) chart to match the row 2 layout: Protein (bottom/green) → Carbs (middle/orange) → Fat (top/red)

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Remove YAxis from all charts to eliminate left indentation

The YAxis creates a fixed-width area on the left side of the chart that causes the bars to be indented from the title. Remove the YAxis component from all 5 charts:

| Line | Chart | Change |
|------|-------|--------|
| 178-182 | Calories | Remove entire `<YAxis ... />` |
| 213-219 | Macros (%) | Remove entire `<YAxis ... />` |
| 260-264 | Row 2 mapped charts | Remove entire `<YAxis ... />` |

#### 2. Reorder stacked bars in Macros (%) chart

Current order (lines 232-234):
```tsx
<Bar dataKey="carbs" ... />    // Bottom
<Bar dataKey="protein" ... />  // Middle  
<Bar dataKey="fat" ... />      // Top
```

New order to match row 2 (Protein | Carbs | Fat):
```tsx
<Bar dataKey="protein" name="Protein" stackId="macros" fill="hsl(142 76% 36%)" radius={[0, 0, 0, 0]} />  // Bottom (green)
<Bar dataKey="carbs" name="Carbs" stackId="macros" fill="hsl(38 92% 50%)" radius={[0, 0, 0, 0]} />      // Middle (orange)
<Bar dataKey="fat" name="Fat" stackId="macros" fill="hsl(346 77% 49%)" radius={[2, 2, 0, 0]} />         // Top (red)
```

---

### Result
- Charts will be left-aligned with their titles (no Y-axis creating indent)
- Macros (%) stacked bar colors from bottom to top: Green (Protein) → Orange (Carbs) → Red (Fat)
- This matches the visual order of the row 2 charts: Protein (green) | Carbs (orange) | Fat (red)


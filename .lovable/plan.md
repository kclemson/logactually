

## Grouped Columns for text_numeric Custom Trends

### Problem
Currently, `text_numeric` log types (like "Measurement") render as stacked bars via `StackedMacroChart`, which uses a hardcoded `stackId="stack"`. The user wants each text label (e.g., "waist", "arm") shown as a separate side-by-side column with slightly different teal shades.

### Approach

**1. Add a `grouped` prop to `StackedMacroChart` (`src/components/trends/FoodChart.tsx`)**

Add an optional `grouped?: boolean` prop. When true, omit the `stackId` from each `<Bar>`, and give all bars `radius={[2, 2, 0, 0]}`. This makes Recharts render them side-by-side instead of stacked.

Line ~386 change:
```tsx
stackId={grouped ? undefined : "stack"}
```
And radius becomes:
```tsx
radius={(grouped || bar.isTop) ? [2, 2, 0, 0] : undefined}
```

**2. Use `grouped` mode for `text_numeric` trends (`src/pages/Trends.tsx`)**

In the `CustomLogTrendChart` component (line ~479), pass `grouped` when rendering multi-series `text_numeric` types. Also use more distinct teal shades optimized for side-by-side display.

Change the multi-series block to:
```tsx
<StackedMacroChart
  title={trend.logTypeName}
  chartData={chartData}
  bars={bars}
  onNavigate={onNavigate}
  formatter={(value, name) => `${name}: ${value}`}
  grouped
/>
```

**3. Adjust teal palette for better contrast between adjacent bars**

Update `TEAL_PALETTE` to use shades that are more visually distinct when side-by-side:
```tsx
const TEAL_PALETTE = ['#14b8a6', '#0d9488', '#2dd4bf', '#0f766e', '#5eead4'];
```

This alternates between lighter and darker shades so adjacent bars are easier to distinguish.

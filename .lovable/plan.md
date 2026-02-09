
## Add Calorie Target Reference Line to Charts

### Overview
When the user has a daily calorie target set, draw a slim dashed horizontal line at the target value on both the "Calories" chart and the "Combined Calories + Macros" chart on the Trends page.

### Changes

**1. `src/components/trends/FoodChart.tsx`**

- Import `ReferenceLine` from `recharts`
- Add optional `referenceLine` prop to `FoodChart`:
  ```typescript
  referenceLine?: { value: number; color?: string };
  ```
- Render a `<ReferenceLine>` inside the `<BarChart>` when the prop is provided:
  ```tsx
  <ReferenceLine
    y={referenceLine.value}
    stroke={referenceLine.color || "hsl(var(--muted-foreground))"}
    strokeDasharray="4 3"
    strokeWidth={1}
    ifOverflow="extendDomain"
  />
  ```
- Add the same optional `referenceLine` prop to `StackedMacroChart` and render the same `<ReferenceLine>` when provided.

**2. `src/pages/Trends.tsx`**

- Pass the `referenceLine` prop to the Calories `FoodChart` and the Combined Calories + Macros `StackedMacroChart` when the user has a calorie target set:
  ```tsx
  referenceLine={settings.dailyCalorieTarget ? { value: settings.dailyCalorieTarget, color: "hsl(var(--muted-foreground))" } : undefined}
  ```

### Behavior
- When no calorie target is set, no line appears (no visual change).
- The line uses a muted foreground color with a dashed pattern so it's visible but unobtrusive in both light and dark themes.
- `ifOverflow="extendDomain"` ensures the line is visible even if no bar reaches the target value.
- No label on the line to keep it clean -- the user already knows their target from Settings, and the tooltip/labels show actual values.

### Files Changed
- `src/components/trends/FoodChart.tsx` -- add `referenceLine` prop to `FoodChart` and `StackedMacroChart`
- `src/pages/Trends.tsx` -- pass the prop for the two calorie charts

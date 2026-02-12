

## Add Subtitle to Macro Split (%) Chart

**Goal**: Add an "avg: P/C/F, today: P/C/F" subtitle to the Macro Split chart so it visually aligns with the Calories chart beside it.

### Changes

**1. `src/components/trends/FoodChart.tsx` -- Add `subtitle` prop to `StackedMacroChart`**

The `StackedMacroChart` component currently lacks subtitle support (unlike `FoodChart` and `VolumeChart` which already have it). Update the component to:
- Add `subtitle?: string` to `StackedMacroChartProps`
- Wrap the `ChartTitle` in the same `flex flex-col gap-0.5` div pattern used by `FoodChart`
- Render `ChartSubtitle` when subtitle is provided

**2. `src/pages/Trends.tsx` -- Pass subtitle to the Macro Split chart**

Compute the P/C/F subtitle using the existing `averages` and `todayValues` objects, and pass it to the `StackedMacroChart`:

```
subtitle={`avg: ${averages.protein}/${averages.carbs}/${averages.fat}, today: ${todayValues.protein}/${todayValues.carbs}/${todayValues.fat}`}
```

This produces something like: `avg: 112/180/65, today: 45/60/20`

### Technical Details

**FoodChart.tsx (StackedMacroChart, around lines 247-317)**:
- Add `subtitle?: string` to the interface
- Change `<ChartTitle>{title}</ChartTitle>` to:
```tsx
<div className="flex flex-col gap-0.5">
  <ChartTitle>{title}</ChartTitle>
  {subtitle && <ChartSubtitle>{subtitle}</ChartSubtitle>}
</div>
```

**Trends.tsx (around line 734)**:
- Add the `subtitle` prop to the Macro Split `StackedMacroChart` call

Two small edits across two files. The subtitle values (grams) are already computed -- just need to format and pass them through.

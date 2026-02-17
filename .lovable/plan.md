

# Show grams + calories in a grid-aligned tooltip for Combined Calories + Macros chart

## Problem

The Combined Calories + Macros tooltip currently shows each macro as a single string (e.g., "Protein: 252 cal"). We want to show grams alongside calories in aligned columns, like:

```text
Protein   63g   252 cal
Carbs    201g   804 cal
Fat       49g   441 cal
```

The current `formatter` prop returns plain strings, which can't achieve column alignment.

## Solution

Add an optional `renderRows` render-prop to `CompactChartTooltip` that, when provided, replaces the default formatter-based payload rendering with custom JSX. This keeps the tooltip generic while letting the Combined chart pass a grid layout.

## Changes

### 1. `src/components/trends/CompactChartTooltip.tsx`

- Add optional `renderRows` prop: `renderRows?: (payload: any[]) => React.ReactNode`
- When `renderRows` is provided, call it instead of the default formatter-based `payload.map(...)` block
- No other changes to the component

### 2. `src/pages/Trends.tsx` (Combined Calories + Macros chart, ~line 352)

- Replace the `formatter` prop with a `renderRows` prop on the `StackedMacroChart`
- Wait -- the `renderRows` needs to flow through `StackedMacroChart` down to `CompactChartTooltip`

### 3. `src/components/trends/FoodChart.tsx` (StackedMacroChart component)

- Add `renderRows` to the `StackedMacroChartProps` interface
- Pass it through to the `CompactChartTooltip` content prop

### Detailed implementation

**CompactChartTooltip.tsx** -- add prop and conditional rendering:

```tsx
// Add to interface:
renderRows?: (payload: any[]) => React.ReactNode;

// In the component body, replace the payload.map block with:
{renderRows
  ? renderRows(payload.slice().reverse())
  : payload.slice().reverse().map((entry, index) => {
      // ... existing formatter logic unchanged
    })
}
```

**FoodChart.tsx** (StackedMacroChart) -- thread the prop:

```tsx
// Add to StackedMacroChartProps:
renderRows?: (payload: any[]) => React.ReactNode;

// Pass to CompactChartTooltip:
<CompactChartTooltip
  renderRows={renderRows}
  formatter={formatter}
  ...
/>
```

**Trends.tsx** -- supply the grid renderer for the Combined chart:

```tsx
renderRows={(rows) => {
  const p = rows[0]?.payload;
  if (!p) return null;
  const macros = [
    { name: "Protein", grams: p.protein, cals: p.proteinCals, color: CHART_COLORS.protein },
    { name: "Carbs", grams: p.carbs, cals: p.carbsCals, color: CHART_COLORS.carbs },
    { name: "Fat", grams: p.fat, cals: p.fatCals, color: CHART_COLORS.fat },
  ];
  return (
    <div className="grid grid-cols-[auto_auto_auto] gap-x-2 text-[10px]">
      {macros.map(m => (
        <React.Fragment key={m.name}>
          <span style={{ color: m.color }}>{m.name}</span>
          <span className="text-right" style={{ color: m.color }}>{Math.round(m.grams)}g</span>
          <span className="text-right" style={{ color: m.color }}>{Math.round(m.cals)} cal</span>
        </React.Fragment>
      ))}
    </div>
  );
}}
```

The existing `formatter` prop stays for other charts -- only the Combined chart uses `renderRows`. Three files touched, no new dependencies.

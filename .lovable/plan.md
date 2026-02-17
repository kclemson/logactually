
# Align percentages in the Macro Split (%) chart tooltip

## What changes

The Macro Split (%) tooltip currently shows unaligned lines like:
```
Protein: 20%
Carbs: 36%
Fat: 44%
```

We'll switch to a grid layout so the names and percentages align in columns:
```
Protein   20%
Carbs     36%
Fat       44%
```

## How

**`src/pages/Trends.tsx`** (line 337-348, the Macro Split chart)

Replace the `formatter` prop with a `renderRows` prop that uses a 2-column CSS grid:

```tsx
<StackedMacroChart
  title="Macro Split (%)"
  subtitle={...}
  chartData={chartData}
  bars={[...]}
  onNavigate={(date) => navigate(`/?date=${date}`)}
  renderRows={(rows) => {
    const p = rows[0]?.payload;
    if (!p) return null;
    const macros = [
      { name: "Protein", pct: p.proteinPct, color: CHART_COLORS.protein },
      { name: "Carbs", pct: p.carbsPct, color: CHART_COLORS.carbs },
      { name: "Fat", pct: p.fatPct, color: CHART_COLORS.fat },
    ];
    return (
      <div className="grid grid-cols-[auto_auto] gap-x-2 text-[10px]">
        {macros.map(m => (
          <React.Fragment key={m.name}>
            <span style={{ color: m.color }}>{m.name}</span>
            <span className="text-right" style={{ color: m.color }}>{m.pct}%</span>
          </React.Fragment>
        ))}
      </div>
    );
  }}
/>
```

One prop swap in one file. The `renderRows` path in `CompactChartTooltip` and `StackedMacroChart` is already wired up from the previous changes.

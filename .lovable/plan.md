

## Reorganize Charts: Calories + Macros Row, then Protein/Carbs/Fat Row

### Overview
Rearrange the chart layout so that:
- **Row 1**: Calories chart + Macros Breakdown chart (2 charts side by side)
- **Row 2**: Protein chart + Carbs chart + Fat chart (3 charts side by side)

---

### Changes

**File: `src/pages/Trends.tsx`**

#### Replace the current chart structure (lines 159-249)

Instead of having Macros Breakdown as a standalone card followed by a 2x2 grid, restructure to:

1. **Row 1 (grid-cols-2)**: Calories chart + Macros Breakdown chart
2. **Row 2 (grid-cols-3)**: Protein + Carbs + Fat charts

```tsx
<div className="space-y-3">
  {/* Row 1: Calories + Macros Breakdown */}
  <div className="grid grid-cols-2 gap-3">
    {/* Calories Chart */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Calories</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 8 }} stroke="hsl(var(--muted-foreground))" width={28} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>

    {/* Macros Breakdown Chart (100% stacked) */}
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Macros (%)</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={percentageChartData}>
              {/* Same stacked bar config but without Legend to save vertical space */}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Row 2: Protein + Carbs + Fat */}
  <div className="grid grid-cols-3 gap-3">
    {/* Map over protein, carbs, fat only */}
    {charts.slice(1).map(({ key, label, color }) => (
      <Card key={key}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="h-24">
            {/* Same chart config as before */}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
</div>
```

---

### Key Adjustments

| Element | Change | Reason |
|---------|--------|--------|
| Macros chart height | `h-40` → `h-24` | Match other charts in the row |
| Macros chart title | "Macros Breakdown (%)" → "Macros (%)" | Shorter title for compact card |
| Macros chart Legend | Removed | Save vertical space in compact layout |
| Row 1 | `grid-cols-2` | Calories + Macros side by side |
| Row 2 | `grid-cols-3` | Protein + Carbs + Fat across |
| Calories chart | Rendered separately, not via map | First item handled individually |
| Macro charts (P/C/F) | `charts.slice(1)` | Skip calories, render remaining 3 |

---

### Result
- Row 1: Calories chart | Macros Breakdown chart
- Row 2: Protein chart | Carbs chart | Fat chart
- All 5 charts visible in a compact 2-row layout
- Consistent card styling and sizing across all charts


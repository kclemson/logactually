

## Add Combined Calories + Macro Stacked Chart (Experimental)

A new full-width stacked bar chart placed below the existing Row 1 charts that merges calorie totals with macro breakdown into a single visualization.

### Chart Design

```text
┌────────────────────────────────────────────────────────────┐
│  Combined Calories + Macros                                │
├────────────────────────────────────────────────────────────┤
│        1850                                                │
│         ┌───┐                        2100                  │
│         │PRO│  1600         1750     ┌───┐                 │
│         │   │   ┌───┐  1400  ┌───┐   │PRO│                 │
│  1200   │   │   │PRO│   ┌───┐│PRO│   │   │                 │
│   ┌───┐ ├───┤   │   │   │PRO││   │   ├───┤                 │
│   │PRO│ │CRB│   ├───┤   │   │├───┤   │CRB│                 │
│   │   │ │   │   │CRB│   ├───┤│CRB│   │   │                 │
│   ├───┤ │   │   │   │   │CRB││   │   │   │                 │
│   │CRB│ ├───┤   │   │   │   │├───┤   ├───┤                 │
│   │   │ │FAT│   ├───┤   ├───┤│FAT│   │FAT│                 │
│   ├───┤ │   │   │FAT│   │FAT││   │   │   │                 │
│   │FAT│ │   │   │   │   │   ││   │   │   │                 │
│   └───┴─┴───┴───┴───┴───┴───┴┴───┴───┴───┴────────────     │
│   Mon   Tue   Wed   Thu   Fri   Sat   Sun                  │
└────────────────────────────────────────────────────────────┘
```

### Key Features

| Feature | Implementation |
|---------|----------------|
| Chart type | Non-100%-stacked column chart |
| Y-axis scale | Calories (actual values, not percentages) |
| Stacking order | Fat (bottom) → Carbs → Protein (top) |
| Macro colors | Same as existing: protein `#115E83`, carbs `#00B4D8`, fat `#90E0EF` |
| Labels above bars | Total calories in blue font (`#0033CC`) |
| Label visibility | Same threshold logic as existing charts |
| Clickable | Navigate to `/` with date param |

### Technical Changes

**File: `src/pages/Trends.tsx`**

#### 1. Extend `chartData` (lines 363-396)

Add the calorie values for each macro to the returned data object:

```tsx
return {
  rawDate: date,
  date: format(new Date(`${date}T12:00:00`), "MMM d"),
  ...totals,
  // Add these three new fields for stacked chart
  proteinCals: totals.protein * 4,
  carbsCals: totals.carbs * 4,
  fatCals: totals.fat * 9,
  proteinPct,
  carbsPct,
  fatPct,
};
```

#### 2. Add new chart after Row 1 (after line 554)

Insert a new full-width Card containing the combined stacked chart:

```tsx
{/* NEW: Combined Calories + Macros Chart (Experimental) */}
<Card className="border-0 shadow-none">
  <CardHeader className="p-2 pb-1">
    <ChartTitle>Combined Calories + Macros</ChartTitle>
  </CardHeader>
  <CardContent className="p-2 pt-0">
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: getFoodChartMarginTop(chartData.length), right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 8 }}
            stroke="hsl(var(--muted-foreground))"
            interval="preserveStartEnd"
            tickMargin={2}
            height={16}
          />
          <Tooltip
            content={<CompactTooltip formatter={(value, name) => `${name}: ${Math.round(value)} cal`} />}
            offset={20}
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
          />
          {/* Stacked bars - first rendered = bottom */}
          <Bar dataKey="fatCals" name="Fat" stackId="macroCals" fill={CHART_COLORS.fat} onClick={...} className="cursor-pointer" />
          <Bar dataKey="carbsCals" name="Carbs" stackId="macroCals" fill={CHART_COLORS.carbs} onClick={...} className="cursor-pointer" />
          <Bar dataKey="proteinCals" name="Protein" stackId="macroCals" fill={CHART_COLORS.protein} radius={[2, 2, 0, 0]} onClick={...} className="cursor-pointer">
            {/* Total calories label above the stack - uses existing showLabel threshold logic */}
            <LabelList dataKey="calories" content={createFoodLabelRenderer(chartData, CHART_COLORS.calories, getFoodLabelOffsetPx(chartData.length))} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

### Label Threshold Logic (Reused)

The `showLabel` field already exists on each `chartData` item (calculated at lines 386-396) using these thresholds:

| Data points | Show every Nth label |
|-------------|----------------------|
| ≤7 | Every label |
| 8-14 | Every 2nd |
| 15-21 | Every 3rd |
| 22-35 | Every 4th |
| >35 | Every 5th |
| Last column | Always shown |

The `createFoodLabelRenderer` helper already checks `chartData[index]?.showLabel` before rendering, so the new chart automatically follows the same visibility rules.

### Result

- Original Calories + Macro Split charts remain untouched (side by side in Row 1)
- New combined chart appears as a full-width row immediately below Row 1, above the individual macro charts
- Protein is visible at the top of each bar
- Total calorie count displayed in blue above each column (using same visibility thresholds)




## Convert Macros Chart to 100% Stacked Column (Calorie Percentages)

Replace the current grouped bar chart for "Macros (g)" with a 100% stacked bar chart that shows each macro as a percentage of that day's total caloric contribution.

---

### Current vs Desired

| Current | Desired |
|---------|---------|
| Grouped bars showing grams (P/C/F side by side) | Stacked bars showing % of calories |
| Height varies based on total grams | All bars same height (100%) |
| Hard to compare relative proportions | Easy to see "what % came from protein/carbs/fat" |

---

### Calculation Logic

Use the same formula as the FoodItemsTable totals row (lines 241-251):

```typescript
// Convert grams to calories
const proteinCals = protein * 4;
const carbsCals = carbs * 4;
const fatCals = fat * 9;
const totalMacroCals = proteinCals + carbsCals + fatCals;

// Calculate percentages
const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;
```

---

### Implementation Changes

**File: `src/pages/Trends.tsx`**

**1. Update chartData calculation (lines 199-220)**

Add percentage fields to each day's data:

```typescript
return Object.entries(byDate).map(([date, totals]) => {
  // Calculate calorie contribution from each macro
  const proteinCals = totals.protein * 4;
  const carbsCals = totals.carbs * 4;
  const fatCals = totals.fat * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals;
  
  // Calculate percentages
  const proteinPct = totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0;
  const carbsPct = totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0;
  const fatPct = totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0;
  
  return {
    date: format(new Date(`${date}T12:00:00`), 'MMM d'),
    ...totals,
    proteinPct,
    carbsPct,
    fatPct,
  };
});
```

**2. Replace the Macros chart (lines 324-353)**

Change from grouped bars to stacked bars with `stackId`:

```tsx
<Card>
  <CardHeader className="p-2 pb-1">
    <ChartTitle>Macro Split (%)</ChartTitle>
  </CardHeader>
  <CardContent className="p-2 pt-0">
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} stackOffset="none">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 8 }}
            stroke="hsl(var(--muted-foreground))"
            interval="preserveStartEnd"
          />
          <Tooltip
            content={<CompactTooltip formatter={(value, name) => 
              `${name}: ${value}%`
            } />}
            offset={20}
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          />
          <Bar dataKey="proteinPct" name="Protein" stackId="macros" fill="#43EBD7" />
          <Bar dataKey="carbsPct" name="Carbs" stackId="macros" fill="#9933FF" />
          <Bar dataKey="fatPct" name="Fat" stackId="macros" fill="#00CCFF" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

Key changes:
- All three bars share `stackId="macros"` to stack them
- Only the top bar (Fat) gets rounded corners
- Tooltip shows percentages with "%" suffix
- Title changes from "Macros (g)" to "Macro Split (%)"

---

### Visual Result

```text
Before (grouped bars):         After (100% stacked):
                               
 |  ▌ ▌       ▌                |  ███████████████████
 |  ▌ ▌ ▌     ▌ ▌              |  ███████████████████
 |  ▌ ▌ ▌ ▌   ▌ ▌ ▌            |  ███████████████████
 +------------------           +--------------------
    Jan 22  Jan 23                Jan 22   Jan 23
                               
   P C F  grouped               [Protein][Carbs][Fat]
   Hard to compare %            Easy to see % split
```

Each stacked column will always reach exactly 100% (or close to it after rounding), making it easy to compare macro ratios day-to-day.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Add percentage fields to chartData, convert macros chart to stacked bars |

---

### Tooltip Display

The tooltip will show:
```
Jan 28
Protein: 32%
Carbs: 48%
Fat: 20%
```

---

### Edge Case: Zero Calories

When a day has zero macro calories (rare), all percentages will be 0%. The bar will be empty, which is correct behavior.


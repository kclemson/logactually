

## Change Macros Chart to Grouped Bar Chart

### Overview
Convert the Macros chart from a 100% stacked column chart to a grouped bar chart, where each day shows three separate side-by-side bars for Protein (green), Carbs (yellow/orange), and Fat (red).

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Update chart title (line 217)

Change from "Macros (%)" to "Macros (g)" since we'll now show actual grams, not percentages.

#### 2. Switch data source from percentageChartData to chartData (line 222)

Use the raw gram values instead of the percentage-based data.

#### 3. Remove stackId from all three Bar components (lines 243-245)

Remove `stackId="macros"` from each Bar - this makes them render as grouped side-by-side bars instead of stacked.

#### 4. Simplify tooltip formatter (lines 231-238)

Since we're now showing grams directly, simplify the tooltip to just show the gram value.

---

### Updated Code

**Lines 214-250 (Macros Chart):**

```tsx
{/* Macros Breakdown Chart (grouped bars) */}
<Card>
  <CardHeader className="p-2 pb-1">
    <CardTitle className="text-sm font-semibold">Macros (g)</CardTitle>
  </CardHeader>
  <CardContent className="p-2 pt-0">
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 8 }}
            stroke="hsl(var(--muted-foreground))"
            interval="preserveStartEnd"
          />
          <Tooltip
            content={<CompactTooltip />}
            offset={20}
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          />
          <Bar dataKey="protein" name="Protein" fill="hsl(142 76% 36%)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="carbs" name="Carbs" fill="hsl(38 92% 50%)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="fat" name="Fat" fill="hsl(346 77% 49%)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

---

### Key Differences

| Aspect | Before (Stacked) | After (Grouped) |
|--------|------------------|-----------------|
| Data source | `percentageChartData` | `chartData` |
| Values shown | Percentages (%) | Grams (g) |
| Bar arrangement | Stacked on top of each other | Side-by-side per day |
| `stackId` prop | Present on all bars | Removed |
| Bar order | Fat, Carbs, Protein (bottom to top) | Protein, Carbs, Fat (left to right) |

---

### Result
- Each day shows 3 separate colored bars side-by-side
- Green bar = Protein, Yellow/orange bar = Carbs, Red bar = Fat
- Tooltip shows actual gram values for each macro
- Easier to compare individual macro amounts across days


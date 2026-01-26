
## Convert Macros Breakdown to 100% Stacked Chart

### Overview
Transform the stacked column chart from showing absolute grams to showing percentage composition. Each day's bar will be the same height (100%) and display the relative proportion of carbs, protein, and fat.

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Create percentage-based chart data (add new useMemo around line 69)

Add a new `percentageChartData` that calculates the percentage of each macro:

```tsx
const percentageChartData = useMemo(() => {
  return chartData.map((day) => {
    const total = day.carbs + day.protein + day.fat;
    if (total === 0) {
      return { date: day.date, carbs: 0, protein: 0, fat: 0, carbsRaw: 0, proteinRaw: 0, fatRaw: 0 };
    }
    return {
      date: day.date,
      carbs: (day.carbs / total) * 100,
      protein: (day.protein / total) * 100,
      fat: (day.fat / total) * 100,
      // Keep raw values for tooltip
      carbsRaw: day.carbs,
      proteinRaw: day.protein,
      fatRaw: day.fat,
    };
  });
}, [chartData]);
```

#### 2. Update the stacked chart to use percentage data (lines 141-197)

- Change `data={chartData}` to `data={percentageChartData}`
- Update chart title from "Macros Breakdown (g)" to "Macros Breakdown (%)"
- Set YAxis domain to `[0, 100]` and add "%" suffix
- Add custom tooltip formatter to show both percentage and raw grams

```tsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="font-semibold">Macros Breakdown (%)</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={percentageChartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            stroke="hsl(var(--muted-foreground))"
            width={35}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string, props: any) => {
              const rawKey = `${name.toLowerCase()}Raw`;
              const rawValue = props.payload[rawKey];
              return [`${Math.round(value)}% (${Math.round(rawValue)}g)`, name];
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconSize={10}
          />
          <Bar dataKey="carbs" name="Carbs" stackId="macros" fill="hsl(38 92% 50%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="protein" name="Protein" stackId="macros" fill="hsl(142 76% 36%)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="fat" name="Fat" stackId="macros" fill="hsl(346 77% 49%)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </CardContent>
</Card>
```

---

### Result
- Every bar reaches exactly 100% height
- Visually compare macro proportions across days
- Y-axis shows 0-100% scale
- Tooltip shows both percentage and raw gram values (e.g., "45% (120g)")
- Makes it easy to spot days with higher/lower protein or carb ratios

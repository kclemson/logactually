

## Add Total Training Volume Chart

### Overview

Add a new chart to Weight Trends showing total training volume (sets × reps × weight) by day, similar to how Calories shows daily totals in Food Trends.

---

### File to Modify

**`src/pages/Trends.tsx`**

---

### Change 1: Add trainingVolume Color to CHART_COLORS

**Lines 19-25** - Add the darker purple color with your preferred naming:

```typescript
const CHART_COLORS = {
  calories: "#0033CC",
  protein: "#115E83",
  carbs: "#00B4D8",
  fat: "#90E0EF",
  trainingVolume: "hsl(262 70% 45%)", // Darker purple for volume chart, visible on both themes
} as const;
```

---

### Change 2: Add volumeByDay Memo

**After line 248** (after `handleDismissGroup`) - Add new memo to aggregate volume:

```typescript
// Aggregate total volume by day across all exercises
const volumeByDay = useMemo(() => {
  const byDate: Record<string, number> = {};

  weightExercises.forEach((exercise) => {
    exercise.weightData.forEach((point) => {
      // point.weight is in lbs, calculate volume in lbs
      const volumeLbs = point.sets * point.reps * point.weight;
      byDate[point.date] = (byDate[point.date] || 0) + volumeLbs;
    });
  });

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, volumeLbs]) => ({
      date: format(new Date(`${date}T12:00:00`), "MMM d"),
      volume: settings.weightUnit === "kg" 
        ? Math.round(volumeLbs * LBS_TO_KG) 
        : Math.round(volumeLbs),
    }));
}, [weightExercises, settings.weightUnit]);
```

---

### Change 3: Add Volume Chart to Weight Trends Section

**Lines 470-479** - Insert the volume chart at the top of the Weight Trends section, before the duplicate prompt:

```tsx
<div className="space-y-3">
  {/* Total Volume Chart */}
  {volumeByDay.length > 0 && (
    <Card className="border-0 shadow-none">
      <CardHeader className="p-2 pb-1">
        <ChartTitle>Total Volume ({settings.weightUnit})</ChartTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeByDay} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 8 }}
                stroke="hsl(var(--muted-foreground))"
                interval="preserveStartEnd"
                tickMargin={2}
                height={16}
              />
              <Tooltip
                content={
                  <CompactTooltip
                    formatter={(value: number) => `${value.toLocaleString()} ${settings.weightUnit}`}
                  />
                }
                offset={20}
                cursor={{ fill: "hsl(var(--muted)/0.3)" }}
              />
              <Bar dataKey="volume" fill={CHART_COLORS.trainingVolume} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )}

  {/* Duplicate exercise prompt - existing code continues... */}
```

---

### Result Layout

```text
Weight Trends
┌─────────────────────────────────────────┐
│  Total Volume (lbs)                     │  ← NEW: Full-width chart
│  [Bar chart showing daily volume]       │
└─────────────────────────────────────────┘

┌─── Duplicate prompt (if any) ───────────┐

┌──────────────────┐ ┌──────────────────┐
│  Lat Pulldown    │ │  Bench Press     │  ← Existing 2-col grid
│  [exercise chart]│ │  [exercise chart]│
└──────────────────┘ └──────────────────┘
```

---

### Summary

| Change | Details |
|--------|---------|
| New color | `trainingVolume: "hsl(262 70% 45%)"` - darker purple visible on both themes |
| Data memo | `volumeByDay` aggregates sets × reps × weight per day across all exercises |
| Unit conversion | Converts to kg when `settings.weightUnit === 'kg'` |
| Chart position | Full-width at top of Weight Trends, before duplicate prompt |
| Tooltip | Shows formatted volume with unit (e.g., "15,420 lbs") |


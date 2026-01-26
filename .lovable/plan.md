
## Arrange Individual Charts in 2x2 Grid

### Overview
Change the layout of the 4 individual macro charts (Calories, Protein, Carbs, Fat) from a vertical stack to a 2-column grid: Calories + Protein on the first row, Carbs + Fat on the second row.

---

### Changes

**File: `src/pages/Trends.tsx`**

#### Replace the charts.map() section (lines 207-244)

Instead of mapping all 4 charts in a vertical stack with `space-y-6`, wrap them in a 2-column grid:

```tsx
{/* Individual Macro Charts - 2x2 Grid */}
<div className="grid grid-cols-2 gap-3">
  {charts.map(({ key, label, color }) => (
    <Card key={key}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
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
              <YAxis
                tick={{ fontSize: 8 }}
                stroke="hsl(var(--muted-foreground))"
                width={28}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey={key}
                fill={color}
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

### Key Adjustments for Compact Layout

| Element | Before | After | Reason |
|---------|--------|-------|--------|
| Grid | Single column (stack) | `grid-cols-2 gap-3` | 2x2 layout |
| Chart height | `h-32` (128px) | `h-24` (96px) | Fit smaller cards |
| Title | `text-base` | `text-sm` | Proportional to card size |
| CardContent padding | `p-6 pt-0` | `p-3 pt-0` | Tighter fit |
| Axis font | `fontSize: 10` | `fontSize: 8` | Fit narrower charts |
| YAxis width | `35` | `28` | Save horizontal space |
| XAxis interval | default | `preserveStartEnd` | Show only first/last labels to avoid crowding |

---

### Result
- 4 charts arranged in 2 rows of 2
- Row 1: Calories | Protein
- Row 2: Carbs | Fat
- More compact view with all trends visible at once
- Maintains the `charts` array order which already matches this grouping



## Switch Weight Trends to Column Charts with Sets x Reps Labels

Convert the weight trends charts from line charts to bar/column charts and add small "3x10" (sets × reps) labels on each column.

---

### Changes Overview

| File | Changes |
|------|---------|
| `src/hooks/useWeightTrends.ts` | Add `totalReps` field to `DailyProgress` interface and aggregate it |
| `src/pages/Trends.tsx` | Convert `ExerciseChart` from `LineChart` to `BarChart`, add `LabelList` import, add custom label renderer |

---

### 1. Update useWeightTrends Hook

Add reps tracking to the `DailyProgress` interface so we can display "sets × reps" on each bar:

**Interface change:**
```typescript
interface DailyProgress {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;  // NEW: track total reps for label display
}
```

**Aggregation logic update:**
- Initialize `totalReps: row.reps` when creating a new daily entry
- Add `existing.totalReps += row.reps` when aggregating

---

### 2. Update ExerciseChart Component

**Import changes:**
- Add `LabelList` to recharts imports

**Chart structure changes:**
- Replace `LineChart` → `BarChart`
- Replace `Line` → `Bar`
- Add `LabelList` inside `Bar` with custom content renderer
- Adjust cursor style from `stroke` to `fill` (bar chart style)

**Custom label renderer:**
A small function that renders "3×10" style text inside each bar:
- Uses `x`, `y`, `width`, `height` from LabelList props
- Positions text centered horizontally, slightly below top of bar
- Uses contrasting white color against the purple bar (`#FFFFFF`)
- Very small font size (7px) to fit within narrow bars

**Visual specification:**
```
┌─────────┐
│  3×10   │  ← small white text near top of bar
│         │
│         │
│         │
│   85    │  ← weight value (shown in tooltip only)
└─────────┘
```

---

### 3. Label Formatting

The label will show simplified "sets × reps" format:
- Example: `3×10` for 3 sets of 10 reps
- If multiple exercises on same day, shows totals: `6×20` (combined sets × combined reps)
- Uses `×` character (multiplication sign) for clarity

---

### Technical Details

**Color contrast:** 
- Bar fill: `hsl(262 83% 58%)` (purple, existing weight theme)
- Label text: `#FFFFFF` (white) for maximum contrast

**Label positioning:**
- `position="inside"` to place text within the bar
- Custom content uses bar geometry to center text

**Updated chart data structure:**
```typescript
const chartData = exercise.dailyData.map(d => ({
  date: format(new Date(d.date), 'MMM d'),
  maxWeight: d.maxWeight,
  totalSets: d.totalSets,
  totalReps: d.totalReps,
  label: `${d.totalSets}×${d.totalReps}`,  // Pre-formatted label
}));
```


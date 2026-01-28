

## Show Separate Bars for Each Weight on Same Day

Currently, the chart aggregates all sets for an exercise on the same day into one bar. This loses important information when you use different weights in the same session. We'll change it to show separate columns for each unique weight value.

---

### Current vs New Behavior

```text
CURRENT (aggregated by date):
Jan 27: ▓▓▓▓ "3×20" @ max 70lbs (loses the 60lb vs 70lb distinction)

NEW (separate by date + weight):
Jan 27: ▓▓ "2×10" @ 60lbs  |  ▓▓ "1×10" @ 70lbs
```

---

### Data Structure Changes

**Current `DailyProgress`:**
- Groups by date only
- Shows max weight, combined sets/reps

**New `WeightPoint`:**
- Groups by date AND weight
- Each unique (date, weight) combination gets its own bar
- Preserves the actual sets×reps for that specific weight

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useWeightTrends.ts` | Change aggregation from "by date" to "by date + weight" |
| `src/pages/Trends.tsx` | Update chart to handle multiple bars per date |

---

### Hook Changes (`useWeightTrends.ts`)

1. Rename `DailyProgress` to `WeightPoint` with updated fields:
   - `date`: string
   - `weight`: number (the actual weight, not max)
   - `sets`: number  
   - `reps`: number

2. Update aggregation logic:
   - Create composite key: `${row.logged_date}_${row.weight_lbs}`
   - If same date AND same weight, combine sets/reps
   - If same date but different weight, create new data point

3. Sort data points by date, then by weight (ascending) for consistent ordering

---

### Chart Changes (`Trends.tsx`)

1. Update `ExerciseChart` to handle the new data structure:
   - Each data point now represents a specific weight, not a day
   - Label shows "sets×reps" as before
   - Tooltip can show the actual weight value

2. X-axis consideration:
   - Multiple bars can share the same date label
   - Bars will naturally group visually by date

---

### Example Data Transformation

**Raw database rows:**
```text
Jan 27 | Lat Pulldown | 2 sets | 10 reps | 60 lbs
Jan 27 | Lat Pulldown | 1 set  | 10 reps | 70 lbs
```

**New chart data:**
```typescript
[
  { date: 'Jan 27', weight: 60, sets: 2, reps: 10, label: '2×10' },
  { date: 'Jan 27', weight: 70, sets: 1, reps: 10, label: '1×10' }
]
```

**Visual result:**
Two adjacent bars for Jan 27, one shorter (60lbs) and one taller (70lbs), each with its own sets×reps label.


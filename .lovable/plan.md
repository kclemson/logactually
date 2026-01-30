

## Make Chart Bars Clickable → Navigate to That Day

### Goal
Clicking/tapping a bar on any Trends chart navigates to that day in the relevant log page (Food or Weights).

### How Hard Is This?
**Very easy** - Recharts `Bar` components support an `onClick` prop that receives the data payload including the date. We just need to:
1. Store the raw date string in chart data (not just the formatted "MMM d" label)
2. Add an `onClick` handler to each `Bar` that calls `navigate()`

### Technical Details

**File: `src/pages/Trends.tsx`**

#### 1. Add `useNavigate` hook
```tsx
import { useNavigate } from 'react-router-dom';
// ...
const navigate = useNavigate();
```

#### 2. Store raw date in chart data
Currently `chartData` only has `date: format(new Date(...), "MMM d")` which is display-only. We need the raw `yyyy-MM-dd` string for navigation.

Update the `chartData` memo to include:
```tsx
rawDate: date,  // e.g., "2025-01-28"
date: format(..., "MMM d"),  // e.g., "Jan 28" (for display)
```

Same for `volumeByDay` (weight volume chart).

#### 3. Add click handler to Food chart Bars
```tsx
<Bar 
  dataKey="calories" 
  fill={...} 
  onClick={(data) => navigate(`/?date=${data.rawDate}`)}
  className="cursor-pointer"
/>
```

Apply to: Calories, Macro Split (all 3 stacked bars), Protein, Carbs, Fat charts.

#### 4. Add click handler to Weight chart Bars
For the Total Volume chart:
```tsx
<Bar 
  dataKey="volume" 
  onClick={(data) => navigate(`/weights?date=${data.rawDate}`)}
  className="cursor-pointer"
/>
```

For per-exercise charts (`ExerciseChart` component), the `weightData` already has `date` in raw format - just add the onClick and store `rawDate`.

### Edge Cases
- **Stacked bars (Macro Split)**: Each segment is clickable, all navigate to the same date - this is fine
- **Multi-weight-per-day exercise bars**: These have composite keys (`date_weight`), we just use the date portion

### Summary of Changes
1. Add `useNavigate` import
2. Add `rawDate` field to `chartData` and `volumeByDay` memos
3. Add `rawDate` field to `ExerciseChart` data
4. Add `onClick` + `className="cursor-pointer"` to all `<Bar>` components:
   - Food charts → `/?date=...`
   - Weight charts → `/weights?date=...`

### Result
- Tapping any bar navigates to that day's log
- Visual feedback via pointer cursor
- Works on both mobile and desktop
- Minimal code change (~15 lines across 6-7 Bar components)


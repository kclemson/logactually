

## Add Speed Toggle to Distance-Based Cardio Charts

### Overview

For cardio exercises that track distance (`walk_run`, `cycling`), add a toggle that switches the Y-axis between **time** (minutes) and **mph** (speed). The entire title + subtitle area becomes a large, tappable touch target.

---

### Scope: Which Exercises?

Only exercises where distance is meaningful:
- `walk_run` - Running/walking outdoors
- `cycling` - Biking outdoors

Other cardio (rowing, elliptical, swimming, stair_climber) typically don't track distance in miles or use different units, so they keep the current duration-only display.

---

### User Experience

**Default view (time mode):**
```
Running                      ← tappable
Cardio · time ▾              ← tappable, indicates toggle available
```

**After tap (mph mode):**
```
Running                      ← tappable  
Cardio · mph ▾               ← tappable
```

- The **entire header area** (title + subtitle) is tappable
- A small ▾ indicator shows this is interactive
- In mph mode, bars without distance data are **hidden** (not grayed out)
- State resets on page refresh (simplest implementation)

---

### Technical Changes

**1. Add helper to identify distance-based exercises**

```tsx
// src/lib/exercise-metadata.ts
export function hasDistanceTracking(exerciseKey: string): boolean {
  return ['walk_run', 'cycling'].includes(exerciseKey);
}
```

**2. Update useWeightTrends hook**

Fetch `distance_miles` and include in `WeightPoint`:

```tsx
// src/hooks/useWeightTrends.ts

export interface WeightPoint {
  // ... existing fields
  distance_miles?: number;
}

// Update query to include distance_miles
.select('exercise_key, description, sets, reps, weight_lbs, logged_date, duration_minutes, distance_miles')

// During aggregation, sum distance for multi-entry days
existing.distance_miles = (existing.distance_miles || 0) + (row.distance_miles || 0);
```

**3. Update ExerciseChart component**

Add local state for the toggle and make header tappable:

```tsx
// In ExerciseChart component
const [showMph, setShowMph] = useState(false);

// Check if this exercise supports mph toggle
const supportsSpeedToggle = hasDistanceTracking(exercise.exercise_key) && isCardio;

// Filter data for mph mode (only entries with distance)
const displayData = useMemo(() => {
  if (!showMph) return chartData;
  return chartData.filter(d => d.distance_miles && d.distance_miles > 0);
}, [chartData, showMph]);

// Calculate mph: distance / (duration / 60)
const calculateMph = (distance: number, minutes: number) => 
  (distance / (minutes / 60)).toFixed(1);

// Tappable header
<CardHeader 
  className={cn("p-2 pb-1", supportsSpeedToggle && "cursor-pointer")}
  onClick={supportsSpeedToggle ? () => setShowMph(!showMph) : undefined}
>
  <div className="flex flex-col gap-0.5">
    <ChartTitle className="truncate">{exercise.description}</ChartTitle>
    <ChartSubtitle>
      {supportsSpeedToggle ? (
        <>Cardio · {showMph ? 'mph' : 'time'} <span className="opacity-50">▾</span></>
      ) : (
        <>Max: {exercise.maxDuration} min · Cardio</>
      )}
    </ChartSubtitle>
  </div>
</CardHeader>
```

**4. Update chart rendering for mph mode**

```tsx
// Y-axis data key changes based on mode
<Bar 
  dataKey={showMph ? "mph" : "duration_minutes"} 
  // ...
/>

// In chartData preparation, add mph calculation
const chartData = exercise.weightData.map(d => ({
  ...d,
  mph: d.distance_miles && d.duration_minutes 
    ? Number((d.distance_miles / (d.duration_minutes / 60)).toFixed(1))
    : null,
}));
```

**5. Update label and tooltip for mph mode**

```tsx
// Label shows mph value instead of minutes
const renderCardioLabel = (props) => {
  const value = showMph 
    ? `${props.value}` // mph value
    : `${props.value}`; // minutes value
  // ...
};

// Tooltip shows context
const tooltipFormatter = (value, name, entry) => {
  if (showMph) {
    return `${entry.payload.mph} mph · ${entry.payload.distance_miles} mi`;
  }
  if (entry.payload.distance_miles) {
    return `${entry.payload.duration_minutes} min · ${entry.payload.distance_miles} mi`;
  }
  return `${entry.payload.duration_minutes} min`;
};
```

---

### Visual Behavior Summary

| Mode | Y-Axis | Bars Shown | Label | Tooltip |
|------|--------|------------|-------|---------|
| time | duration_minutes | All entries | "12" (minutes) | "12 min · 1.0 mi" or "12 min" |
| mph | mph | Only entries with distance | "6.0" (mph) | "6.0 mph · 1.0 mi" |

---

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/exercise-metadata.ts` | Add `hasDistanceTracking()` helper |
| `src/hooks/useWeightTrends.ts` | Fetch `distance_miles`, include in WeightPoint, aggregate |
| `src/pages/Trends.tsx` | Add toggle state to ExerciseChart, tappable header, conditional rendering |


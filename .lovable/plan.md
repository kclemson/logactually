

## Update Expanded Cardio Display Format

### Overview
Update the expanded entry view for cardio exercises in the Weights tab to match the tooltip format from the Trends charts, showing pace, speed, and distance in a comma-separated single line.

---

### Current Format
```
1.18 mile run: 12:41, 1.18 mi
```

### New Format
```
1.18 mile run: 10:42/mi, 5.6 mph, 1.18 mi in 12:41
```

Shows: pace (mm:ss/mi), speed (mph), distance with duration

---

### Implementation

**File:** `src/components/WeightItemsTable.tsx` (lines 620-636)

Update the cardio metadata rendering to calculate and display:
1. **Pace** - `duration_minutes / distance_miles` formatted as mm:ss/mi
2. **Speed** - `distance_miles / (duration_minutes / 60)` as mph
3. **Distance with duration** - `X.XX mi in mm:ss`

```tsx
{/* Cardio metadata - show for each cardio item */}
{cardioItems.map((ex, idx) => {
  const duration = ex.duration_minutes ?? 0;
  const distance = ex.distance_miles ?? 0;
  
  // Calculate pace (min/mi) and speed (mph)
  const hasBothMetrics = duration > 0 && distance > 0;
  const paceDecimal = hasBothMetrics ? duration / distance : null;
  const mph = hasBothMetrics 
    ? (distance / (duration / 60)).toFixed(1) 
    : null;
  
  // Build display string
  let displayParts: string;
  if (hasBothMetrics) {
    const paceFormatted = formatDurationMmSs(paceDecimal!);
    const durationFormatted = formatDurationMmSs(duration);
    displayParts = `${paceFormatted}/mi, ${mph} mph, ${distance} mi in ${durationFormatted}`;
  } else if (duration > 0) {
    displayParts = formatDurationMmSs(duration);
  } else if (distance > 0) {
    displayParts = `${distance} mi`;
  } else {
    displayParts = '';
  }
  
  return (
    <p key={ex.uid || idx} className="text-sm text-muted-foreground">
      <span className="font-medium">{ex.description}:</span>{' '}
      {displayParts}
    </p>
  );
})}
```

---

### Logic Summary

| Data Available | Display Format |
|----------------|----------------|
| Both duration + distance | `10:42/mi, 5.6 mph, 1.18 mi in 12:41` |
| Duration only | `12:41` |
| Distance only | `1.18 mi` |

---

### Files Changed
- `src/components/WeightItemsTable.tsx` - Update cardio metadata formatting in expanded view


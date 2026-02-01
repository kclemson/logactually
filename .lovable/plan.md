
## Unify Cardio Tooltip Format

### Goal

Make both mph and time view tooltips display the same 4 rows:
1. **Pace** (min/mi in mm:ss format, e.g., "14:36 /mi")
2. **Speed** (mph)
3. **Distance** (mi)
4. **Time** (mm:ss)

### Current State

| View | Row 1 | Row 2 | Row 3 | Row 4 |
|------|-------|-------|-------|-------|
| mph | 4.1 mph | 14.6 min/mi | 0.8 mi | — |
| time | 11:40 | 0.8 mi | — | — |

### After Change

| View | Row 1 | Row 2 | Row 3 | Row 4 |
|------|-------|-------|-------|-------|
| mph | 14:36 /mi | 4.1 mph | 0.8 mi | 11:40 |
| time | 14:36 /mi | 4.1 mph | 0.8 mi | 11:40 |

### Implementation

**File: `src/pages/Trends.tsx`** (lines 280-292)

Update the cardio tooltip formatter to:
1. Convert pace from decimal to mm:ss using `formatDurationMmSs()`
2. Return all 4 rows consistently for both views

```typescript
formatter={(value: number, name: string, entry: any) => {
  if (isCardio) {
    const duration = formatDurationMmSs(Number(entry.payload.duration_minutes || 0));
    const distance = entry.payload.distance_miles;
    const mph = entry.payload.mph;
    const paceDecimal = entry.payload.pace;
    
    // Show full 4-row format when we have distance data
    if (distance && mph && paceDecimal) {
      const paceFormatted = formatDurationMmSs(paceDecimal);
      return [
        `${paceFormatted} /mi`,   // Pace in mm:ss
        `${mph} mph`,              // Speed
        `${distance} mi`,          // Distance
        duration                   // Time
      ];
    }
    
    // Fallback for cardio without distance (e.g., stationary bike with time only)
    if (distance) {
      return [duration, `${distance} mi`];
    }
    return duration;
  }
  // ...weight exercises unchanged
}}
```

### Example Output

For a 0.8 mi run in 11:40 (11.67 min):
- Pace: 11.67 / 0.8 = 14.59 min/mi → `14:35 /mi`
- Speed: 0.8 / (11.67/60) = 4.1 mph
- Distance: 0.8 mi
- Time: 11:40

Tooltip will show:
```
Feb 1
14:35 /mi
4.1 mph
0.8 mi
11:40
```

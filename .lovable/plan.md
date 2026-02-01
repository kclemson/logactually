

## Merge Distance and Time in Cardio Tooltip

### Goal

Combine the last two rows (distance and time) into a single row showing "x mi in mm:ss"

### Current Format (just implemented)

| Row | Content |
|-----|---------|
| 1 | 14:36 /mi |
| 2 | 4.1 mph |
| 3 | 0.8 mi |
| 4 | 11:40 |

### New Format

| Row | Content |
|-----|---------|
| 1 | 14:36 /mi |
| 2 | 4.1 mph |
| 3 | 0.8 mi in 11:40 |

### Implementation

**File: `src/pages/Trends.tsx`** (lines 288-294)

Update the return array from 4 items to 3:

```typescript
if (distance && mph && paceDecimal) {
  const paceFormatted = formatDurationMmSs(paceDecimal);
  return [
    `${paceFormatted} /mi`,           // Pace in mm:ss
    `${mph} mph`,                      // Speed
    `${distance} mi in ${duration}`   // Distance + Time combined
  ];
}
```

### Example Output

For a 0.8 mi run in 11:40:

```
Feb 1
14:35 /mi
4.1 mph
0.8 mi in 11:40
```


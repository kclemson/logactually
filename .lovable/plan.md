
## Convert Duration Display to mm:ss Format

### Summary

Change the duration display from decimal format (e.g., "11.0 min") to mm:ss format (e.g., "11:00") in cardio tooltips and expanded metadata sections. Bar chart labels remain as decimal values for space efficiency.

### Scope Clarification

| Location | Current | Change |
|----------|---------|--------|
| Chart bar labels (above bars) | `11.0` | **No change** (decimal) |
| Chart tooltips (on hover) | `11.0 min · 0.8 mi` (single line) | `11:00` + separate line for distance |
| Weight Log expanded section | `11.0 min, 0.8 mi` | `11:00` + `0.8 mi` (same comma format but with mm:ss) |
| Create Routine Dialog preview | `(11.0 min)` | `(11:00)` |
| Save Routine Dialog preview | `(11.0 min)` | `(11:00)` |

### Implementation

**1. Create utility function in `src/lib/weight-units.ts`**

Add a new function to convert decimal minutes to mm:ss format:

```typescript
export function formatDurationMmSs(decimalMinutes: number): string {
  const totalSeconds = Math.round(decimalMinutes * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

**2. Update `src/pages/Trends.tsx`** (tooltip only, lines 270-281)

Change the tooltip formatter to use mm:ss and split duration/distance onto separate rows:

```typescript
formatter={(value: number, name: string, entry: any) => {
  if (isCardio) {
    const duration = formatDurationMmSs(Number(entry.payload.duration_minutes || 0));
    const distance = entry.payload.distance_miles;
    if (showMph && entry.payload.mph) {
      const pace = entry.payload.pace;
      // Return array for multi-line: speed, pace, distance
      return [`${entry.payload.mph} mph`, `${pace} min/mi`, `${distance} mi`];
    }
    if (distance) {
      // Return array for multi-line: duration, distance
      return [duration, `${distance} mi`];
    }
    return duration;
  }
  // ...weight exercises unchanged
}}
```

Also update CompactTooltip to handle array returns as separate rows.

**3. Update `src/components/WeightItemsTable.tsx`** (lines 618-622)

```typescript
if ((ex.duration_minutes ?? 0) > 0) {
  parts.push(formatDurationMmSs(Number(ex.duration_minutes)));
}
```

**4. Update `src/components/CreateRoutineDialog.tsx`** (line 30)

```typescript
return `${first.description} (${formatDurationMmSs(Number(first.duration_minutes))})`;
```

**5. Update `src/components/SaveRoutineDialog.tsx`** (line 33)

```typescript
return `${exercise.description} (${formatDurationMmSs(Number(exercise.duration_minutes))})`;
```

### Examples

| Decimal Input | mm:ss Output |
|---------------|--------------|
| 11.0 | 11:00 |
| 11.5 | 11:30 |
| 30.25 | 30:15 |
| 5.75 | 5:45 |
| 0.5 | 0:30 |

### Tooltip Before/After

**Before (single line):**
```
Feb 1
11.0 min · 0.8 mi
```

**After (multi-line):**
```
Feb 1
11:00
0.8 mi
```

**MPH mode before:**
```
5.2 mph · 11.5 min/mi · 0.8 mi
```

**MPH mode after:**
```
5.2 mph
11.5 min/mi
0.8 mi
```

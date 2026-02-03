

## Fix Cardio Detection for Distance-Only Entries

### Overview
When logging "5 mile run", the AI correctly parses it as cardio with `distance_miles: 5` but no `duration_minutes`. However, the UI only checks for `duration_minutes > 0` to detect cardio, so it fails to show the "cardio" label and instead displays 0/0/0 in the sets/reps/weight columns.

---

### Root Cause

The backend (edge function) correctly validates cardio as:
```typescript
const hasCardioData = duration_minutes > 0 || distance_miles > 0;
```

But the frontend checks only:
```typescript
const isCardioItem = weight_lbs === 0 && (duration_minutes ?? 0) > 0;
```

This misses entries that have distance but no duration.

---

### Solution

Update all cardio detection logic in the frontend to match the backend:

```typescript
// Before
const isCardioItem = item.weight_lbs === 0 && (item.duration_minutes ?? 0) > 0;

// After
const isCardioItem = item.weight_lbs === 0 && 
  ((item.duration_minutes ?? 0) > 0 || (item.distance_miles ?? 0) > 0);
```

---

### Files to Update

**1. `src/components/WeightItemsTable.tsx`**

| Line | Current | Updated |
|------|---------|---------|
| 414 | Main cardio check | Add `\|\| (item.distance_miles ?? 0) > 0` |
| 462 | Sets fallback (show "—") | Add `\|\| (item.distance_miles ?? 0) > 0` |
| 500 | Reps fallback (show "—") | Add `\|\| (item.distance_miles ?? 0) > 0` |
| 565 | Weight column display | Add distance handling + show "5.0 mi" when no duration |

**2. `src/components/SaveRoutineDialog.tsx`** (line 32)

Update cardio check and handle distance-only display:
```typescript
const isCardio = exercise.weight_lbs === 0 && 
  ((exercise.duration_minutes ?? 0) > 0 || (exercise.distance_miles ?? 0) > 0);
if (isCardio) {
  const duration = exercise.duration_minutes ?? 0;
  const distance = exercise.distance_miles ?? 0;
  if (duration > 0 && distance > 0) {
    return `${exercise.description} (${formatDurationMmSs(duration)}, ${distance.toFixed(1)} mi)`;
  } else if (distance > 0) {
    return `${exercise.description} (${distance.toFixed(1)} mi)`;
  } else {
    return `${exercise.description} (${formatDurationMmSs(duration)})`;
  }
}
```

**3. `src/components/CreateRoutineDialog.tsx`** (line 29)

Same pattern as SaveRoutineDialog.

**4. `src/pages/Trends.tsx`** (line 111)

Update the chart-level cardio detection:
```typescript
// Before
const isCardio = exercise.maxWeight === 0 && exercise.maxDuration > 0;

// After  
const isCardio = exercise.maxWeight === 0 && 
  (exercise.maxDuration > 0 || exercise.maxDistance > 0);
```

---

### Display Logic for Weight Column

When showing a cardio item in the weight column, prioritize appropriately:

```typescript
// Weight column for cardio
if (duration > 0) {
  return `${duration.toFixed(1)} min`;
} else if (distance > 0) {
  return `${distance.toFixed(1)} mi`;
}
```

---

### Test Cases After Fix

| Input | Expected Behavior |
|-------|-------------------|
| "30min on treadmill" | Shows "cardio" label, displays "30.0 min" |
| "5 mile run" | Shows "cardio" label, displays "5.0 mi" |
| "1.18 mile run in 12:41" | Shows "cardio" label, displays "12.7 min" |


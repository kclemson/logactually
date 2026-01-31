

## Fix Total Volume Chart to Exclude Cardio Entries

### Problem

The "Total Volume (lbs)" chart displays "0k" bars on days with only cardio entries. This happens because:
- Volume = sets × reps × weight
- Cardio entries have weight = 0, so volume = 0
- The chart shows these 0-volume days as bars

### Solution

Filter out zero-weight data points when calculating the total volume by day. This excludes cardio exercises (which have 0 lbs) from the volume calculation.

---

### Technical Changes

**File: `src/pages/Trends.tsx`**

Update the `volumeByDay` calculation (around line 379) to skip data points with zero weight:

```typescript
// Current (lines 382-387):
weightExercises.forEach((exercise) => {
  exercise.weightData.forEach((point) => {
    byDate[point.date] = (byDate[point.date] || 0) + point.volume;
  });
});

// Updated:
weightExercises.forEach((exercise) => {
  exercise.weightData.forEach((point) => {
    // Skip cardio/bodyweight entries (0 lbs = 0 volume anyway)
    if (point.weight === 0) return;
    byDate[point.date] = (byDate[point.date] || 0) + point.volume;
  });
});
```

---

### Result

| Before | After |
|--------|-------|
| Shows "0k" bars for cardio-only days | No bar shown for cardio-only days |
| Cardio days inflate the x-axis | Only weight training days appear |


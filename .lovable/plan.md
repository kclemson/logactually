

## Fix Training Volume Calculation Bug

### Problem

The Total Volume chart shows **23,500 lbs** for Jan 28, but the WeightLog table shows **18,100 lbs**. This is a ~30% overcounting.

### Root Cause

The issue is in `useWeightTrends.ts` where data is aggregated by `date + weight` composite key:

```typescript
// Lines 62-77 in useWeightTrends.ts
if (existing) {
  existing.sets += row.sets;  // e.g., 2 + 1 = 3
  existing.reps += row.reps;  // e.g., 10 + 10 = 20
}
```

Then in `Trends.tsx`, volume is calculated:
```typescript
const volumeLbs = point.sets * point.reps * point.weight;
// = 3 × 20 × 180 = 10,800
```

**But the correct calculation is**:
```
(2 × 10 × 180) + (1 × 10 × 180) = 3,600 + 1,800 = 5,400
```

When you add sets and reps together then multiply, you get a mathematically incorrect result. Volume must be calculated per-row FIRST, then summed.

### Example from Jan 28 data

`seated_calf_raise` has two rows with weight 180:
- Row 1: 2 sets × 10 reps × 180 lbs = 3,600
- Row 2: 1 set × 10 reps × 180 lbs = 1,800
- **Correct total**: 5,400

Current buggy calculation:
- Combined: 3 sets × 20 reps × 180 lbs = **10,800** (2x overcounting!)

---

### Solution

Two options:

**Option A (Minimal change)**: Don't use the pre-aggregated `useWeightTrends` data for volume calculation. Fetch raw data separately or calculate volume per-row before aggregating.

**Option B (Recommended)**: Add a `volume` field to each `WeightPoint` in `useWeightTrends` that pre-calculates volume per-row before aggregation.

I recommend **Option B** because:
1. It keeps volume calculation accurate at the source
2. The aggregated sets/reps are still useful for the individual exercise charts (showing set groupings)
3. Single source of truth for volume

---

### File Changes

**File 1: `src/hooks/useWeightTrends.ts`**

Update the `WeightPoint` interface and aggregation logic:

```typescript
export interface WeightPoint {
  date: string;
  weight: number;
  sets: number;
  reps: number;
  volume: number;  // NEW: Pre-calculated volume for this point
}
```

In the aggregation loop, calculate and accumulate volume separately:

```typescript
if (existing) {
  existing.sets += row.sets;
  existing.reps += row.reps;
  existing.volume += row.sets * row.reps * weight;  // Accumulate correctly
} else {
  trend.weightData.push({
    date: row.logged_date,
    weight,
    sets: row.sets,
    reps: row.reps,
    volume: row.sets * row.reps * weight,  // Calculate on creation
  });
}
```

---

**File 2: `src/pages/Trends.tsx`**

Update `volumeByDay` to use the pre-calculated volume:

```typescript
const volumeByDay = useMemo(() => {
  const byDate: Record<string, number> = {};

  weightExercises.forEach((exercise) => {
    exercise.weightData.forEach((point) => {
      // Use pre-calculated volume instead of recalculating
      byDate[point.date] = (byDate[point.date] || 0) + point.volume;
    });
  });

  // ... rest remains the same
}, [weightExercises, settings.weightUnit]);
```

---

### Summary

| Change | File | Details |
|--------|------|---------|
| Add `volume` field | `useWeightTrends.ts` | Pre-calculate volume per row before aggregation |
| Update aggregation | `useWeightTrends.ts` | Accumulate volume correctly: `existing.volume += row.sets * row.reps * weight` |
| Use pre-calculated | `Trends.tsx` | Reference `point.volume` instead of `point.sets * point.reps * point.weight` |

This ensures the Total Volume chart matches the WeightLog table exactly.


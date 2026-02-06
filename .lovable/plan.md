

## Fix: repsPerSet Calculation Bug

### Problem Identified

The database stores reps as **per-set value**, not total reps:
- "3 sets × 10 reps" → `sets=3, reps=10`
- Volume = `sets × reps × weight` = 30 reps total

My calculation `reps / sets = 10 / 3 = 3.333...` was dividing the per-set value by sets, producing fractional garbage.

### The Fix

**File: `src/hooks/useWeightTrends.ts`**

Change the repsPerSet calculation from division to direct assignment:

```typescript
// WRONG (current):
const rowRepsPerSet = row.sets > 0 ? row.reps / row.sets : row.reps;

// CORRECT:
const rowRepsPerSet = row.reps;  // reps is already per-set in the DB
```

That's it - single line fix. The uniformity tracking logic is already correct (comparing if values differ).

### Why This Works

| Log Entry | DB: sets | DB: reps | rowRepsPerSet (fixed) |
|-----------|----------|----------|----------------------|
| 3×10 @ 135 | 3 | 10 | 10 ✓ |
| 1×10 @ 65 | 1 | 10 | 10 ✓ |
| 1×7 @ 65 | 1 | 7 | 7 (differs → undefined) |

### Result

- "Lat Pulldown" with consistent 3×10 entries → shows `3×10` ✓
- "Leg Extension" with 10, 5, 7 reps → shows `1×22` (collapsed)
- No more `3.333333335` garbage labels


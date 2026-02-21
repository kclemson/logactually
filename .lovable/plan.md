
# Fix: Total calorie burn display ignoring calories_burned_override

## Problem
The "Total" row at the top of the exercise log computes its calorie burn display without passing `calories_burned_override` into the estimation function. So when you add or remove a manual calorie override via DetailDialog, the per-exercise inline display updates correctly (we just fixed that), but the total stays stale because it's computed from a different code path that has the same omission.

## Root Cause
In `src/pages/WeightLog.tsx` (lines 747-756), the `ExerciseInput[]` array passed to `estimateTotalCalorieBurn` maps each `displayItem` but omits `calories_burned_override`.

## Fix
Add `calories_burned_override` to the mapping on line 755, same one-line fix pattern as CalorieBurnInline:

### File: `src/pages/WeightLog.tsx` (line 755)

```typescript
// Before:
exercise_metadata: item.exercise_metadata,

// After:
exercise_metadata: item.exercise_metadata,
calories_burned_override: item.calories_burned_override,
```

This ensures the total uses the override when present, and falls back to estimation when removed -- matching the per-exercise inline behavior.

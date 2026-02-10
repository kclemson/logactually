

## Show "cardio" Label for Exercises Without Duration/Distance

### Problem

When logging something like "swam 20 laps", the AI may return a tiny estimated distance (e.g., 0.02 mi) or -- after the validation softening -- no duration/distance at all. In both cases, showing "0.02 mi" or "0 lbs" is unhelpful. These should just display "cardio".

### Changes (2 files)

**1. Soften validation (`supabase/functions/analyze-weights/index.ts`)**

This is the already-approved change: allow known cardio keys through the validation even without `duration_minutes` or `distance_miles`. Add a fallback before the error throw:

```typescript
if (!hasWeightData && !hasCardioData) {
  const knownCardioKeys = ['walk_run', 'cycling', 'elliptical', 'rowing', 'stair_climber', 'swimming', 'jump_rope'];
  if (!knownCardioKeys.includes(String(exercise.exercise_key))) {
    console.error(/*...*/);
    throw new Error("Could not understand exercise...");
  }
}
```

**2. Update display logic (`src/components/WeightItemsTable.tsx`)**

Two spots need updating:

**(a) The `isCardioItem` detection (around line 492)**: Currently only triggers when `duration_minutes > 0 || distance_miles > 0`. Add a fallback: also treat items as cardio when `weight_lbs === 0` and `isCardioExercise(exercise_key)` returns true. This catches entries where neither duration nor distance was provided.

**(b) The compact weight column display (around line 657)**: Currently shows `X.XX mi` or `X.X min` for cardio. Add a fallback for known cardio exercises with no meaningful duration/distance -- display "cardio" instead of a near-zero metric.

The logic becomes:
- Has duration? Show duration (e.g., "30.0 min")
- Has distance but no duration? Show distance (e.g., "2.00 mi")  
- Known cardio with neither? Show "cardio"
- Otherwise: show weight as before

This requires importing `isCardioExercise` from `@/lib/exercise-metadata` into `WeightItemsTable.tsx` and checking `item.exercise_key` against it.


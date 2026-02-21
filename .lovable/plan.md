

# Fix: CalorieBurnInline ignoring calories_burned_override

## Problem
When a user manually enters a calorie burn value (either via the inline editor or in the original log text), the expanded panel still shows the estimated range (e.g., "~138-150") instead of the exact override value (e.g., "152 cal").

## Root Cause
In `CalorieBurnInline.tsx` (lines 25-34), the input object passed to `estimateCalorieBurn` includes `exercise_key`, `sets`, `reps`, `weight_lbs`, `duration_minutes`, `distance_miles`, and `exercise_metadata` -- but omits `calories_burned_override`.

The `estimateCalorieBurn` function (calorie-burn.ts line 348) checks `exercise.calories_burned_override` first and returns an exact value if found. Since it's never passed, the override is always ignored.

## Fix
One-line addition in `CalorieBurnInline.tsx`: include `calories_burned_override` in the input object passed to `estimateCalorieBurn`.

### File: `src/components/CalorieBurnInline.tsx`

In the `results` mapping (line 22-35), add `calories_burned_override`:

```typescript
result: estimateCalorieBurn({
  exercise_key: ex.exercise_key,
  exercise_subtype: ex.exercise_subtype,
  sets: ex.sets,
  reps: ex.reps,
  weight_lbs: ex.weight_lbs,
  duration_minutes: ex.duration_minutes,
  distance_miles: ex.distance_miles,
  exercise_metadata: ex.exercise_metadata,
  calories_burned_override: ex.calories_burned_override,  // <-- add this
}, settings),
```

This single addition fixes both scenarios:
1. User enters override via DetailDialog -- the WeightSet already has `calories_burned_override` populated after refetch
2. User logs with calories in the text (e.g., "152 calories burned") -- the AI extraction sets the override, which is stored in the column

When the override is present, `estimateCalorieBurn` returns `{ type: 'exact', value: 152 }`, and the display changes from "Estimated calories burned: ~138-150" to "Estimated calories burned: 152 cal".

## Display label consideration
Once an override is active, the label "Estimated calories burned" becomes slightly misleading since the value is no longer estimated. However, changing the label is a separate cosmetic decision and not part of this bug fix.


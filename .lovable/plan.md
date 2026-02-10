

## Add `exercise_subtype` Column for Granular Activity Tracking

### Problem

The `walk_run` exercise key intentionally consolidates walking, running, hiking, and treadmill activities because manual text input is often ambiguous. But Apple Health data is precise -- importing 2,847 walks and 156 runs into the same `walk_run` bucket would make charts and trends useless, with walks drowning out runs.

### Solution

Add an optional `exercise_subtype` text column to `weight_sets`. When present, charts and trends can split data by subtype. When absent (legacy manual entries), everything works exactly as it does today.

### Schema Change

**`weight_sets` table:** Add `exercise_subtype` (text, nullable, default NULL)

Example values by exercise_key:

```text
exercise_key  | exercise_subtype
--------------|-----------------
walk_run      | walking
walk_run      | running
walk_run      | hiking
walk_run      | NULL          (ambiguous manual entry)
cycling       | indoor
cycling       | outdoor
cycling       | NULL          (manual entry)
swimming      | pool
swimming      | open_water
swimming      | NULL
```

### How It Flows Through the System

**Apple Health Import (always sets subtype):**
- HKWorkoutActivityTypeWalking -> exercise_key: `walk_run`, exercise_subtype: `walking`
- HKWorkoutActivityTypeRunning -> exercise_key: `walk_run`, exercise_subtype: `running`
- HKWorkoutActivityTypeHiking -> exercise_key: `walk_run`, exercise_subtype: `hiking`
- HKWorkoutActivityTypeCycling + HKIndoorWorkout=1 -> `cycling`, subtype: `indoor`
- HKWorkoutActivityTypeCycling + HKIndoorWorkout=0 -> `cycling`, subtype: `outdoor`
- HKWorkoutActivityTypeSwimming + HKSwimmingLocationType=1 -> `swimming`, subtype: `pool`

**Manual entry via analyze-weights (optionally sets subtype):**
- "ran 3 miles 25 min" -> exercise_key: `walk_run`, exercise_subtype: `running`
- "treadmill 30 min" -> exercise_key: `walk_run`, exercise_subtype: `NULL` (ambiguous)
- "hiked 5 miles" -> exercise_key: `walk_run`, exercise_subtype: `hiking`

**Existing data:** All current rows get `NULL` subtype. No behavior change.

### Chart/Trends Behavior

The trends page (`useWeightTrends.ts`) currently aggregates by `exercise_key`. With subtypes:

- If a `walk_run` exercise has rows with subtypes, show them as **separate trend entries**: "Walking", "Running", "Hiking"
- Rows with NULL subtype stay grouped as "Walk / Run" (the current behavior)
- The description field on each trend entry comes from the subtype display name when available
- This means a user who only manually logs will see no change; a user who imports Apple Health data will see their walks and runs as separate charts

### Files to Change

1. **Database migration** - Add `exercise_subtype` column to `weight_sets`

2. **`src/types/weight.ts`** - Add `exercise_subtype?: string | null` to `WeightSet`, `WeightSetRow`, `AnalyzedExercise`, and `SavedExerciseSet`

3. **`src/hooks/useWeightTrends.ts`** - Change aggregation key from just `exercise_key` to `exercise_key + (exercise_subtype || '')`. When subtype exists, use its display name as the trend description

4. **`src/lib/exercise-metadata.ts`** - Add subtype-aware display names and muscle group lookups (subtypes inherit from parent key, e.g., `walking` inherits Cardio from `walk_run`)

5. **`supabase/functions/_shared/exercises.ts`** and **`supabase/functions/analyze-weights/index.ts`** - Add optional `exercise_subtype` to the AI response schema so the normalizer can set it when the input is unambiguous

6. **`src/hooks/useAppleHealthImport.ts`** (new, part of the import feature) - Set subtype based on Apple Health workout activity type mapping

7. **`src/components/WeightItemsTable.tsx`** - Display subtype in the description when present (e.g., show "Running" instead of generic "Walk / Run")

### What This Does NOT Change

- Saved routines: subtypes are informational, not required. A saved routine with `walk_run` exercises works fine without subtypes
- History page calendar: still just checks if weight_sets exist for a date
- Existing manual entry flow: no UI changes needed, the AI normalizer optionally populates it

### Implementation Order

This is a prerequisite for the Apple Health import feature. Recommended sequence:
1. Database migration (add column)
2. Type updates
3. Trends aggregation update
4. Exercise metadata updates
5. AI normalizer update (edge function)
6. Then build the import feature on top


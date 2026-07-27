# Fix: Exercise trend chart titles use arbitrary user text

## Problem

Exercise chart titles in Trends (e.g. "NE 40th 1.4m walk", "One mile treadmill run") come from the first `weight_sets.description` row picked up by the aggregation, not from the canonical exercise catalog. Any user-typed entry text on the first-seen row becomes the chart's title.

Verified in code:
- `src/hooks/useWeightTrends.ts:68` seeds `ExerciseTrend.description` with `row.description` (first-wins, never overwritten).
- `src/components/trends/ExerciseChart.tsx:216` renders `<ChartTitle>{exercise.description}</ChartTitle>`.
- Canonical labels already exist: `getExerciseDisplayName(exercise_key)` and `getSubtypeDisplayName(exercise_subtype)` in `src/lib/exercise-metadata.ts`.

## Fix

Render the chart title from the canonical exercise key/subtype instead of the user description. Drop the user description from the trends view entirely (it still lives on each entry in the log).

### Title rule
- If `exercise_subtype` is present → `getSubtypeDisplayName(exercise_subtype)` (e.g. "Walking", "Running").
- Otherwise → `getExerciseDisplayName(exercise_key)` (e.g. "Leg press", "Diverging low row", "Cycling").

This matches the answered preference: subtype-only when the trend is split by subtype (currently only `walk_run`), falling back to the base canonical name for everything else.

### Changes
- `src/components/trends/ExerciseChart.tsx`: replace `{exercise.description}` in the `<ChartTitle>` with the canonical name derived from `exercise.exercise_key` + `exercise.exercise_subtype` via the helpers above. Import the helpers from `@/lib/exercise-metadata`.
- `src/hooks/useWeightTrends.ts`: `description` is no longer used for display; either drop the field from `ExerciseTrend` or leave it as internal metadata. Preference: **drop it** from the type and select list so there's no future confusion. Check for any other reader before deleting (grep for `.description` on the exercise trend shape).

### Out of scope
- Chart ordering, aggregation, muscle-group subtitle, and everything downstream of the title.
- Individual log entries still show the user's typed description as before.

## Verification
- Manual: on /trends the walk_run split now shows "Walking" and "Running" (or subtype title-case fallback); every other exercise shows its `EXERCISE_DISPLAY_NAMES` label ("Leg press", "Diverging low row", etc.).
- `tsgo` typecheck passes after removing `description` from `ExerciseTrend` (compiler will flag any remaining reader).

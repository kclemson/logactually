

# Fix: Tooltip z-order and multiple tooltip issues + exercise count bug

## Problem 1: Multiple tooltips and z-order

Each chart uses the same pattern: a dismiss overlay at `z-10` and chart content at `z-20`. This means tapping a bar on a different chart passes right through the first chart's overlay (since `z-20 > z-10`), opening a second tooltip without closing the first. The tooltip also renders behind lower charts because its `zIndex: 9999` is trapped inside the `z-20` stacking context.

**Fix (CSS only, no React context needed):**
- Raise the dismiss overlay from `z-10` to `z-30` so it sits above all other charts' `z-20` content -- this prevents opening a second tooltip
- When a tooltip is active, add `z-50` to the Card itself so the tooltip renders above all sibling charts

## Problem 2: Exercise count in tooltip

The calorie burn hook counts unique exercises per day using a Set keyed by `exercise_key`. But `walk_run` covers walking, running, and hiking as separate trend entries that all share the same key. So 2 dog walks + 1 treadmill run = 1 cardio instead of 2.

**Fix:** Use a composite key `exercise_key::subtype` when adding to the Set, so walking and running count separately.

## Files to change

### `src/components/trends/CalorieBurnChart.tsx`
- Change dismiss overlay from `z-10` to `z-30`
- Conditionally add `z-50` to the Card when tooltip is active

### `src/components/trends/FoodChart.tsx`
- Same overlay and Card z-index changes (applies to FoodChart, StackedMacroChart, and VolumeChart components in this file)

### `src/components/trends/ExerciseChart.tsx`
- Same overlay and Card z-index changes

### `src/hooks/useDailyCalorieBurn.ts`
- Line 60: change `exercise.exercise_key` to a composite key that includes `exercise.exercise_subtype` when present
- Update the `isCardioExercise` check to still use the base `exercise_key`

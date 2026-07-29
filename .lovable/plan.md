Add filtering so the Exercise Trends section only renders charts that are actually useful, based on the user's chosen thresholds.

## Threshold rules

Apply these filters to the exercise list before rendering charts (after `useWeightTrends` returns data, in `src/pages/Trends.tsx`):

1. **Minimum sessions**: require `sessionCount >= 3`.
2. **Relative activity floor**: require `sessionCount >= 0.10 * maxSessionCount` across all exercises for the selected period.
3. **Weight-bearing usefulness**: for non-cardio exercises, require `maxWeight > 0`. Cardio exercises (duration/distance-based) are exempt.

The combined effect: an exercise must have at least 3 sessions, be in the top 90% of your logged activity, and (for weights) actually have weight data.

## Implementation

- In `src/pages/Trends.tsx`, derive a `qualifiedExercises` array from `weightExercises` by applying the three rules above.
- Replace `weightExercises` with `qualifiedExercises` when building:
  - `exercisePool`
  - `visibleExercises`
  - `hasMoreExercises`
  - `duplicateGroups` (so duplicate detection only runs on exercises that would be charted)
  - `exerciseSectionVisible` logic
- Keep `useWeightTrends` unchanged; this is a presentation-layer filter.
- Update the empty-state copy when no exercises qualify, so it doesn't just say "No weight training data for this period." Suggest something like: "No exercises meet the chart threshold (3+ sessions)."

## Out of scope

- Does not add a reps/volume chart for bodyweight exercises.
- Does not change the "Show more" batch size (still +10).
- Does not affect the exercise log, calorie burn chart, or custom charts.
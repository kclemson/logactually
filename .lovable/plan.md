## Goal
Make every exercise chart title self-describing by including the parent exercise name whenever a subtype is present.

## Change
In `src/components/trends/ExerciseChart.tsx`, replace the current title logic:

```ts
getSubtypeDisplayName(exercise.exercise_subtype) ?? getExerciseDisplayName(exercise.exercise_key)
```

with a uniform pattern: when a subtype exists, render `"{Parent} — {Subtype}"`; otherwise render the parent name alone.

Examples:
- Cycling + indoor → "Cycling — Indoor"
- Walk/Run + walking → "Walk/Run — Walking"
- Swimming + pool → "Swimming — Pool"
- Leg press (no subtype) → "Leg press"

No other files change. No prompt or catalog changes. Redundancy in cases like "Walk/Run — Walking" is accepted per user preference for consistency.

## Verification
- Typecheck
- Spot-check the "Indoor" chart now reads "Cycling — Indoor"

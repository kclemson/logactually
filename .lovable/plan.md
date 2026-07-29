## Diagnosis (confirmed against your data)

On the all-time view, your top strength exercise (`lat_pulldown`) has 77 sessions, so the current 10% relative floor evaluates to `ceil(77 * 0.1) = 8`. Deadlift has **7 all-time sessions**, so it falls one below the cutoff. Same story for `shoulder_press` (7), `lateral_raise` (6), `romanian_deadlift` (4), `dumbbell_row` (4).

The 10% rule works as intended on shorter periods (90d floor for strength is ~3), but on all-time it becomes disproportionately aggressive because prolific machine work dominates the max.

## Fix

Cap the relative floor at **5 sessions**. Formula becomes:

```
floor = max(3, min(ceil(bucketMax * 0.1), 5))
```

Effect:
- Small history: floor stays at 3 (unchanged from today).
- Medium history: floor scales up to 5.
- Large history: floor is capped at 5, so anything you've done 5+ times always shows.

This preserves "hide the long tail" (something done 1–4 times remains hidden) while ensuring genuinely recurring exercises like deadlifts survive. With this change, your all-time view picks up deadlift, shoulder_press, lateral_raise, seated_leg_curl, shoulder_press_machine, etc. — about 12 strength charts + 2 cardio instead of 4+2.

Only touches the `qualifiedExercises` `useMemo` in `src/pages/Trends.tsx`.

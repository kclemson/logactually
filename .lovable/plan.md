

# Calorie burn: account for reps and lifting weight in strength duration

## What changes

Replace the flat 35-45 seconds/set duration estimate with a bottoms-up calculation:

```text
Per-set active time = reps x seconds_per_rep (3s low, 4s high)
Per-set rest time   = base_rest (30s low, 45s high) + weight_bonus
  weight_bonus      = clamp(weight_lbs / 100, 0, 0.5) x 30s  (0-15s extra)
Total duration      = sets x (active_time + rest_time)
```

Example outputs (for intuition):
- 3x10 @ 135 lbs: ~(30+40) to ~(40+51) sec/set = 3.5-4.6 min
- 3x5 @ 135 lbs: ~(15+40) to ~(20+51) sec/set = 2.8-3.6 min (less time, fewer reps)
- 3x15 @ 25 lbs: ~(45+34) to ~(60+49) sec/set = 3.9-5.4 min (more reps, less rest)
- 3x10 @ 315 lbs: ~(30+45) to ~(40+60) sec/set = 3.8-5.0 min (heavier = more rest)

The old constants `SECONDS_PER_SET_LOW` / `SECONDS_PER_SET_HIGH` are removed.

## Files changed

| File | Change |
|---|---|
| `src/lib/calorie-burn.ts` | Update `estimateStrengthDuration` to accept `reps` and `weight_lbs`, compute duration from per-rep active time plus weight-scaled rest. Remove unused `SECONDS_PER_SET_*` constants. Update call site at line ~350 to pass `exercise.weight_lbs`. |
| `src/lib/calorie-burn.test.ts` | Update existing `estimateStrengthDuration` tests for new formula. Add tests: more reps increases duration, heavier weight increases duration, 0 reps with sets still returns rest-only duration. |

## What does NOT change

- MET lookup, effort narrowing, incline bonus, BMR scaling, composition multiplier
- Cardio estimation (uses explicit `duration_minutes`)
- UI components, database, edge functions

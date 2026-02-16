

# Fix: Widen weight bonus range so changing lbs visibly affects calorie estimates

## How this fits in the formula

```
calories = MET x body_weight_kg x duration_hours x composition x bmr_scale
                                   ^^^^^^^^^^^^^^^
                                   this is what we're fixing
```

Duration for strength = `sets x (reps x 3-4s + base_rest + weight_bonus)`

The weight_bonus currently caps at just 50 lbs, making all heavier weights identical. We widen the curve so it differentiates across 25-200 lbs.

## Constants to change in `src/lib/calorie-burn.ts`

| Constant | Current | New | Effect |
|---|---|---|---|
| `WEIGHT_REST_DIVISOR` | 100 | 200 | Slower ramp-up |
| `WEIGHT_REST_MAX_FACTOR` | 0.5 | 1.0 | Higher ceiling before cap |
| `WEIGHT_REST_BONUS_SECONDS` | 30 | 45 | More total bonus available |

New formula: `clamp(weight_lbs / 200, 0, 1.0) x 45s`

- 25 lbs: ~6s extra rest
- 100 lbs: ~23s
- 135 lbs: ~30s
- 200+ lbs: 45s (cap)

## Files changed

| File | Change |
|---|---|
| `src/lib/calorie-burn.ts` | Update 3 constants (lines ~141-143) |
| `src/lib/calorie-burn.test.ts` | Update `3x10 @ 135 lbs` test expectations for new rest values. Update `weight bonus caps` test to reflect cap at 200 lbs instead of 50 lbs. |

## What does NOT change

- MET lookup, effort narrowing, incline bonus, BMR scaling
- Cardio estimation
- UI components, database, edge functions


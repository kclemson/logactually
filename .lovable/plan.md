

# Three-Step Equation + Remove Tilde

## Changes to `src/components/CalorieTargetDialog.tsx`

### 1. Split into three equation rows
Currently the TDEE row combines `BMR x multiplier - deficit = target`. Split this into:

```
Base metabolic rate (BMR)
150 lbs, 5'1", 48 years, Female = 1,248

Total daily energy expenditure (TDEE)
1,248 x 1.375 = 1,716

Daily calorie target
1,716 - 500 deficit = 1,216 cal/day
```

### 2. Remove tilde (~) from BMR and TDEE results
Currently shows `= ~1,248`. Change to `= 1,248` (and same for TDEE).

### Technical details

The `equationData` memo already computes and returns `tdee` separately from `target`, so no memo changes are needed.

The JSX equation block (lines 248-268) will be updated from two `div` blocks to three:

1. **BMR row** -- same as now but `~` removed from result
2. **TDEE row** -- shows `BMR x multiplier = TDEE` (no deficit, no tilde)
3. **Daily calorie target row** -- shows `TDEE - deficit = target cal/day`

| File | Change |
|---|---|
| `src/components/CalorieTargetDialog.tsx` | Replace two equation divs with three; remove `~` prefix from BMR and TDEE values |


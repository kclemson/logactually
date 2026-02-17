

# Show equation math for body_stats mode with activity level multipliers

Currently, when a user picks "Estimated burn rate minus a deficit" with one of the standard activity levels (sedentary, light, moderate, active), `getCalorieTargetComponents` returns `null`, so both the daily and rollup tooltips fall through to the plain single-line static fallback. This plan adds a new branch so those configs get the same structured equation layout.

## What the tooltip should show

For body_stats with a multiplier-based activity level (no exercise burns involved), the equation is simply:

```text
  2,100   (total daily energy expenditure)
-   350   (deficit configured in settings)
= 1,750   daily calorie target
```

If deficit is 0, skip the deficit row and omit the result row (just show the single TDEE line, like the static fallback but labeled as TDEE).

## Technical details

### 1. Extend `getCalorieTargetComponents` (`src/lib/calorie-target.ts`)

Currently returns `null` at line 231 when `activityLevel !== 'logged'`. Add a new branch for body_stats with multiplier activity levels:

- Compute TDEE via `computeTDEE(bmr, activityLevel)`
- Return a new component object with `mode: 'body_stats_multiplier'`, `tdee`, and `deficit`

Update the `CalorieTargetComponents` interface to include `'body_stats_multiplier'` in the mode union.

### 2. Update daily tooltip (`src/pages/History.tsx`, lines 248-284)

The `if (targetComponents)` block currently handles `exercise_adjusted` and `body_stats_logged`. Add handling for `body_stats_multiplier`:

- Show TDEE row
- Show deficit row (if > 0)
- Show result row with `= {target}` and label `daily calorie target`
- No exercise burn row (this mode doesn't use logged burns)

### 3. Update rollup tooltip (`src/components/CalorieTargetRollup.tsx`)

The `renderEquationBlock` function currently handles `exercise_adjusted` vs `body_stats_logged`. Add a third branch for `body_stats_multiplier`:

- Show TDEE row
- Show deficit row (if > 0)
- Show result row -- no avg burn row needed since this mode doesn't vary by day

Since the target doesn't vary by day in this mode, the equation block is the same for 7-day and 30-day. Could simplify to show it once, or keep both for consistency with the existing layout.

### Files to edit

- `src/lib/calorie-target.ts` -- extend interface and `getCalorieTargetComponents`
- `src/pages/History.tsx` -- add `body_stats_multiplier` branch in daily tooltip
- `src/components/CalorieTargetRollup.tsx` -- add `body_stats_multiplier` branch in rollup tooltip


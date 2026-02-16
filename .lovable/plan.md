

# Use sedentary baseline for "Use my exercise logs" + show example days

## Overview

Instead of treating "Use my exercise logs" as a completely separate code path, reuse the existing TDEE equation display with the sedentary multiplier (x1.2) hardcoded. Then show the daily target formula as `TDEE + logged exercise - deficit`, followed by up to 5 recent example days with the actual math.

## What the user sees

The equation breakdown when "Use my exercise logs" is selected:

```text
Base metabolic rate (BMR):
180 lbs, 5'10", 35 years, Male = 1,650

Total daily energy expenditure (TDEE):
1,650 x 1.2 = 1,980

Daily calorie target:
1,980 + logged exercise (varies daily) - 200

Examples:
February 14th: 1,980 + 320 - 200 = 2,100 cal
February 12th: 1,980 + 85 - 200 = 1,865 cal
February 11th: 1,980 + 540 - 200 = 2,320 cal
```

- The TDEE line always shows x1.2 (sedentary) when "Use my exercise logs" is selected
- The target line shows the dynamic formula with logged exercise
- When deficit is unset, shows faded "deficit" placeholder (matching existing pattern)
- Up to 5 most recent days before today with burn data are shown
- If no recent burn data exists, just the formula lines are shown (no "Examples:" section)

## Technical Details

### 1. `src/lib/calorie-target.ts` -- Update `getEffectiveDailyTarget`

Change the `'logged'` branch from `BMR - deficit` to `BMR x 1.2 - deficit`:

```typescript
if (settings.activityLevel === 'logged') {
  const deficit = settings.dailyDeficit ?? 0;
  const sedentaryTdee = bmr * ACTIVITY_MULTIPLIERS.sedentary; // 1.2
  const target = Math.round(sedentaryTdee - deficit);
  return target > 0 ? target : null;
}
```

### 2. `src/components/CalorieTargetDialog.tsx` -- Unify equation display + add examples

**equationData memo**: When `isLogged`, set `multiplier` to `1.2` (sedentary) and compute `tdee` and `target` using it, instead of leaving them null. This means the existing TDEE and target display lines work for both paths.

Remove the `isLogged` ternary branch in the equation breakdown. Instead, the existing TDEE + target lines render for all activity levels. The only difference for `isLogged`: the "Daily calorie target" line appends `+ logged exercise (varies daily)` before the deficit, and omits the computed `= X cal/day` result (since it varies).

**Add `loggedExerciseExamples` memo**:
- Filter `dailyBurnData` for dates strictly before today
- Sort descending, take first 5
- For each: compute `{ dateFormatted, burnCals (midpoint), total: tdee + burnCals - deficit }`
- Only when `equationData?.isLogged` and `equationData?.tdee` are available

**Render examples**: After the target line, if `isLogged` and examples exist, show "Examples:" heading followed by each row.

### 3. `src/lib/calorie-target.test.ts` -- Update expected values

Update the `'logged'` test to expect `BMR x 1.2 - deficit` instead of `BMR - deficit`. The test currently asserts `result < 2000`; with the x1.2 multiplier the value will be higher, so update accordingly.

### Files modified

| File | Change |
|---|---|
| `src/lib/calorie-target.ts` | Logged branch uses `bmr * 1.2` |
| `src/components/CalorieTargetDialog.tsx` | Unify equation display (logged uses same TDEE lines with x1.2), add examples memo + render |
| `src/lib/calorie-target.test.ts` | Update expected values for logged tests |


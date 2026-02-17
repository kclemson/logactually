
# Fix DCT dialog wording + tooltip formula mismatch

## Issue 1: DCT dialog wording

In `CalorieTargetDialog.tsx` line 344, change:
```
+ logged exercise (varies daily)
```
to:
```
+ calories burned from exercise logs (varies daily)
```

## Issue 2: Tooltip shows confusing number

The rollup tooltip currently says "Target: 1,147 cal/day + exercise (from TDEE)". That 1,147 is the pre-computed base (TDEE minus deficit), which doesn't match anything the user sees in the DCT dialog. The dialog shows the formula as "1,497 + exercise - 350".

The fix: for body_stats/logged mode, show the formula components separately in the tooltip so it matches the dialog:

```
Target: 1,497 + exercise - 350 cal/day
```

Or when deficit is 0:
```
Target: 1,497 + exercise cal/day
```

For body_stats with a fixed activity level (non-logged), the current approach is fine since there's no exercise component -- just show the resolved number like "Target: 1,650 cal/day (from TDEE)".

## Technical Details

### File: `src/components/CalorieTargetDialog.tsx`
- Line 344: change "logged exercise" to "calories burned from exercise logs"

### File: `src/lib/calorie-target.ts`
- Update `describeCalorieTarget` for the body_stats/logged branch:
  - Compute BMR and sedentary TDEE separately (same math as `getEffectiveDailyTarget` but without subtracting deficit)
  - Format as `"Target: {tdee} + exercise - {deficit} cal/day"` when deficit > 0
  - Format as `"Target: {tdee} + exercise cal/day"` when deficit is 0
  - This matches exactly what the DCT dialog shows

### File: `src/lib/calorie-target.test.ts`
- Update the existing test for body_stats/logged to match the new format

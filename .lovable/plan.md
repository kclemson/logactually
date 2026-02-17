

# Add sedentary TDEE to Estimated Calorie Burn chart

## Overview
For users with biometrics configured, enhance the calorie burn chart tooltip with a "show the math" equation using the established term "total daily energy expenditure" (matching the Calendar/DCT tooltip on line 42/52 of `CalorieTargetTooltipContent.tsx`). Also update the chart subtitle.

## Terminology (consistent with existing tooltips)
- Sedentary TDEE (BMR x 1.2) labeled as: **(total daily energy expenditure)** -- same label used in the DCT tooltip
- Exercise burn labeled as: **(exercise burn estimate)**
- Sum labeled as: **(est. total incl. exercise)**

## Changes

### 1. `src/pages/Trends.tsx`
- Import `computeAbsoluteBMR` from `@/lib/calorie-burn` and `ACTIVITY_MULTIPLIERS` from `@/lib/calorie-target`
- Compute `sedentaryTDEE`: if `computeAbsoluteBMR(settings)` returns a number, multiply by `ACTIVITY_MULTIPLIERS.sedentary` and round; otherwise null
- Pass `sedentaryTDEE` as a new prop to `CalorieBurnChart`
- Update subtitle: when `sedentaryTDEE` is available, append ` · TDEE: ~{sedentaryTDEE}` to the existing subtitle

### 2. `src/components/trends/CalorieBurnChart.tsx`
- Add optional `sedentaryTDEE?: number | null` to `CalorieBurnChartProps`
- Pass it through to `BurnTooltip`
- When `sedentaryTDEE` is present, append below the exercise count line:

```text
Feb 5
~384 cal (range: 358-409)
9 exercises (1 cardio, 8 strength)

  2,054  (total daily energy expenditure)
+   384  (exercise burn estimate)
= 2,438  (est. total incl. exercise)
```

- Styling: `grid grid-cols-[auto_1fr]`, `text-[10px]`, `tabular-nums`, `opacity-75`, separated by a `border-t` -- matching `CalorieTargetTooltipContent` exactly
- When `sedentaryTDEE` is null, tooltip remains unchanged

## Files modified
- `src/pages/Trends.tsx`
- `src/components/trends/CalorieBurnChart.tsx`

## No backend changes needed
`computeAbsoluteBMR` and `ACTIVITY_MULTIPLIERS.sedentary` already exist. No database or edge function changes required.


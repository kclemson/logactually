

# Multi-line Equation Tooltips for body_stats + logged Mode

## Overview

Replace the single-line target description with a stacked math equation in both the rollup tooltip and the per-day calendar tooltips, but only when the user is in `body_stats` mode with `logged` activity level. Other modes keep their current format.

## Rollup Tooltip (CalorieTargetRollup)

Current:
```
Target: 1,497 + exercise - 350 cal/day
```

New:
```
Daily calorie target:
  1,497 (total daily energy expenditure)
+ calories burned from logged exercise
- 350 (deficit configured in settings)
```

When deficit is 0, the third line is omitted.

## Per-Day Calendar Tooltip (History)

Current:
```
Mon, Feb 14
1,666 / 1,630 cal target (incl. 483 burn)
```

New:
```
Mon, Feb 14
1,666 / 1,630 daily calorie target

  1,497 (total daily energy expenditure)
+ 483 (calories burned from logged exercise)
- 350 (deficit configured in settings)
```

When deficit is 0, the deficit line is omitted. When burn is 0 for that day, the exercise line shows "+ 0".

## Technical Details

### File: `src/lib/calorie-target.ts`

Add a new function `getCalorieTargetComponents` that returns structured data instead of a string:

```typescript
export interface CalorieTargetComponents {
  tdee: number;
  deficit: number;
  mode: 'body_stats_logged';
}

export function getCalorieTargetComponents(settings: UserSettings): CalorieTargetComponents | null
```

Returns non-null only for `body_stats` + `logged` mode. Computes the sedentary TDEE and deficit from settings.

`describeCalorieTarget` remains unchanged for use in non-logged modes. The rollup and day tooltips will check `getCalorieTargetComponents` first; if non-null, render the equation; otherwise fall back to `describeCalorieTarget`.

### File: `src/components/CalorieTargetRollup.tsx`

- Import `getCalorieTargetComponents`
- In the tooltip content, check if components are available
- If yes: render the multi-line equation with monospace-style alignment using left-aligned text
- If no: render `targetDescription` as before (single line)
- The equation lines use `text-primary-foreground` to match the existing tooltip style

### File: `src/pages/History.tsx`

- Import `getCalorieTargetComponents`
- In `buildDayTooltip`, check if components are available
- If yes: after the `intake / target daily calorie target` line, render the equation breakdown with the actual burn value for that day
- If no: keep the current format (`intake / target cal target (incl. burn)`)

### File: `src/lib/calorie-target.test.ts`

- Add tests for `getCalorieTargetComponents`: returns correct tdee/deficit for body_stats+logged, returns null for other modes

### No other files changed

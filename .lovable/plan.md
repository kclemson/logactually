

# Fix: Weekly equation shows wrong total

## Problem
The weekly `TargetEquation` receives `burn={weekRollup.avgBurn}` (correct) but `target={target}` (the daily target for that specific day). So if the day burned 465 cal but the weekly average is 474 cal, the equation shows "1500 + 474" but still says "= 1965" (which is 1500 + 465, the daily total). It should say "= 1974".

## Fix in `src/components/CalorieTargetTooltipContent.tsx`

Compute a `weeklyTarget` before passing it to the weekly `TargetEquation`:

- **exercise_adjusted**: `Math.round(targetComponents.baseTarget + weekRollup.avgBurn)`
- **body_stats_logged**: `Math.round(targetComponents.tdee + weekRollup.avgBurn - targetComponents.deficit)`
- **body_stats_multiplier** or **static**: use the same `target` value (no per-day variation)

Change line 58 from:
```tsx
<TargetEquation targetComponents={targetComponents} target={target} burn={weekRollup.avgBurn} isWeekly />
```
to:
```tsx
<TargetEquation targetComponents={targetComponents} target={weeklyTarget} burn={weekRollup.avgBurn} isWeekly />
```

where `weeklyTarget` is computed just above based on the mode. This ensures the "= X" total line matches the equation's addends.




# Replace "rolling" with "weekly" / "30-day" legends, interleaved with math

## Overview

Replace the single "rolling:" legend row with two separate legend rows — "weekly:" above the 7-day math block and "30-day:" above the 30-day math block — matching the interleaved pattern already used in the daily/weekly calendar tooltip.

## Change in `src/components/CalorieTargetRollup.tsx`

### 1. Remove the standalone `RollupLegend` component (lines 16-25)

It's no longer needed since each section gets its own inline legend.

### 2. Replace the tooltip content (lines 131-148)

Instead of one legend at top + stacked equations, interleave:

```
weekly:   [green] under   [amber] <=5%   [rose] >5%
7 days: 1,709 avg [dot]
  1,500  (daily calorie target)
  + 359  (avg calories burned last 7 days)
  = 1,859  avg target last 7 days

--- separator ---
30-day:   [green] under   [amber] <=5%   [rose] >5%
30 days: 1,638 avg [dot]
  1,500  (daily calorie target)
  + 312  (avg calories burned last 30 days)
  = 1,812  avg target last 30 days
```

Each section includes:
- A 4-column legend grid row with the period label ("weekly:" or "30-day:")
- A header line showing intake avg + status dot (with `opacity-100` on the dot)
- The equation block

For multiplier mode (no burns, single shared equation), show one "weekly:" legend above the equation.

### Technical detail

- Remove `RollupLegend` function entirely
- In the tooltip content, render each period block as: legend row, then header with avg intake + dot, then equation
- Add a `border-t` separator between the 7-day and 30-day sections
- Use the existing `ROLLUP_GREEN_MAX` and `ROLLUP_AMBER_MAX` constants for legend labels
- The legend uses the same 4-column grid pattern: `grid-cols-[auto_auto_auto_auto] gap-x-2`

### Files changed

| File | Changes |
|------|---------|
| `src/components/CalorieTargetRollup.tsx` | Remove `RollupLegend`, interleave "weekly:" and "30-day:" legends with their respective math blocks, add intake header lines with status dots |


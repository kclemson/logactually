

# Tooltip Refinements: Separate Averages, Tighter Labels, Dot Colors

## Changes

### 1. Separate burn averages for 7-day and 30-day rollup tooltip

Currently the rollup tooltip uses a single `displayBurn` value (whichever is available first). Instead, show two separate equation blocks -- one for the 7-day average burn and one for the 30-day average burn -- or conditionally show the appropriate average. Since the tooltip is shared for both rollup periods, the simplest approach: show both periods' equations stacked, each with its own average burn.

### 2. Tighten equation labels

- Rollup tooltip exercise line: `(avg calories burned last 7 days)` / `(avg calories burned last 30 days)`
- Daily tooltip exercise line: `(calories burned from exercise)` (keep short, it's a specific day)

### 3. Remove extra border-top line from daily tooltip

Currently there are two `border-t` dividers: one above the equation result (1,585) and one above the dot legend. Remove the one above the dot legend so the result and legend flow together.

### 4. Show colored dot next to target number in daily tooltip

In two places where the computed target appears (the "intake / target daily calorie target" line and the equation result line), add a colored dot using `getTargetDotColor(intake, target)` to match the dot shown on the calendar cell.

## Technical Details

### File: `src/components/CalorieTargetRollup.tsx`

- Instead of a single equation block, show two stacked blocks (one per available rollup period) each with its own average burn:
  ```
  7-day avg calorie target:
    1,497  (total daily energy expenditure)
  +   355  (avg calories burned last 7 days)
  -   350  (deficit configured in settings)

  30-day avg calorie target:
    1,497  (total daily energy expenditure)
  +   328  (avg calories burned last 30 days)
  -   350  (deficit configured in settings)
  ```
  If only one period is available, show just that one.

- Remove the `displayBurn` variable since each block uses its own `r7.avgBurn` / `r30.avgBurn`.

### File: `src/pages/History.tsx` (`buildDayTooltip`)

- Line 250: Add a colored dot after the target number using `getTargetDotColor(intake, target)`
- Line 264-266: Add the same colored dot after the equation result target number
- Line 267: Remove the second `border-t` divider -- change it to just `pt-1.5 space-y-0.5` (no border)
- Line 256: Tighten label to `(calories burned from exercise)`

### Files Changed
- `src/components/CalorieTargetRollup.tsx`
- `src/pages/History.tsx`


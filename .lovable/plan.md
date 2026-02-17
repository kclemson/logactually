

# Enhanced Equation Tooltips: Grade-School Math Layout

## Changes Overview

Four improvements to the calorie target tooltips on the History page:

1. **Per-day tooltip: complete the equation** -- add a horizontal rule and show the computed target as the "answer" line, making it look like a proper math equation
2. **Right-align all numbers** in both tooltips so they line up like a real equation
3. **Rollup tooltip: show average burn** -- compute and display the actual average daily burn from logged exercise instead of the generic "calories burned from logged exercise" text
4. **Per-day tooltip: correct dot thresholds** -- show 2.5% and 10% (matching the daily `getTargetDotColor` thresholds) instead of the rollup's 0%/5% thresholds

---

## Per-Day Tooltip (New Layout)

```text
Sun, Feb 15
1,666 / 1,630 daily calorie target

      1,497  (total daily energy expenditure)
    +   483  (calories burned from logged exercise)
    -   350  (deficit configured in settings)
   ────────
      1,630
```

The numbers right-align. A thin border-top acts as the "line under the equation" and the result repeats the target number.

## Rollup Tooltip (New Layout)

```text
Daily calorie target:
      1,497  (total daily energy expenditure)
    +   328  (avg calories burned from logged exercise)
    -   350  (deficit configured in settings)

 * at or under target       (green)
 * up to 5% over            (amber)
 * more than 5% over        (rose)
```

Where 328 is the actual average daily burn across the eligible days in the window.

## Per-Day Dot Legend

Change from rollup thresholds (0%/5%) to daily thresholds (2.5%/10%):
- Green: within 2.5% of target
- Amber: up to 10% over
- Rose: more than 10% over

---

## Technical Details

### File: `src/lib/calorie-target.ts`

**Add `avgBurn` to `RollupResult`:**

```typescript
export interface RollupResult {
  avgIntake: number;
  avgBurn: number;   // NEW
  dotColor: string;
  dayCount: number;
}
```

In `computeCalorieRollup`, accumulate total burn across eligible days and compute the average:

```typescript
let totalBurn = 0;
for (const day of eligible) {
  const burn = usesBurns ? (burnByDate.get(day.date) ?? 0) : 0;
  totalBurn += burn;
  // ... existing target logic
}
// add to return:
avgBurn: usesBurns ? Math.round(totalBurn / eligible.length) : 0,
```

### File: `src/components/CalorieTargetRollup.tsx`

Replace the equation section in the tooltip with a right-aligned grid layout. Use `r7.avgBurn` (or `r30.avgBurn`) for the exercise burn line. Since both windows may have different averages, use the 7-day average if available, else the 30-day average.

The equation uses a 2-column grid:
- Column 1 (right-aligned, tabular-nums): the numbers with +/- prefix
- Column 2: the parenthetical description

### File: `src/pages/History.tsx`

In `buildDayTooltip`, for the `targetComponents` branch:
- Use the same 2-column grid for the equation
- Add a border-top line after the equation rows
- Add a final row showing the computed `target` value as the "answer"
- Add the dot threshold legend at the bottom with 2.5%/10% thresholds (matching `getTargetDotColor`)

### Files Changed
- `src/lib/calorie-target.ts` -- add `avgBurn` to `RollupResult`, compute it in `computeCalorieRollup`
- `src/components/CalorieTargetRollup.tsx` -- right-aligned equation grid with actual avg burn value
- `src/pages/History.tsx` -- right-aligned equation grid with sum line, 2.5%/10% dot legend


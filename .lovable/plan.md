

# Calorie target tooltip improvements (4 items)

## 1. Fix dot opacity mismatch in legend vs equation sections

The dots in the daily/weekly header lines (e.g., "Mon, Feb 9: 1,521 cal") and the equation `=` line inherit `opacity-75` from their parent container, making them appear washed out compared to the legend dots at the top. The fix is to override opacity on the dot `<span>` elements so they render at full brightness regardless of the parent's opacity.

### Technical detail

In `CalorieTargetTooltipContent.tsx`, the day header line (line 44) and weekly header line (line 72) both have `className="opacity-75"`. The dot spans inside them inherit that opacity. Add `opacity-100` class to the dot spans on those lines so they match the legend.

---

## 2. Restructure tooltip: interleave legends with their sections

Move the daily legend to sit just above the daily section, and the weekly legend just above the weekly section (instead of grouping both legends together at the top).

### New layout

```text
daily:   [green] <=2.5%   [amber] <=10%   [rose] >10%
Mon, Feb 9: 1,521 cal [dot]
  1,500  (daily calorie target)
  + 438  (calories burned from exercise)
  = 1,938 adjusted daily calorie target

--- separator ---
weekly:  [green] under   [amber] <=5%   [rose] >5%
Week of Feb 8-14: 1,805 avg [dot]
  1,500  (daily calorie target)
  + 341  (avg calories burned from exercise)
  = 1,841 avg adjusted daily calorie target
```

### Technical detail

In `CalorieTargetTooltipContent.tsx`:
- Remove the combined legend grid at the top (lines 27-40)
- Place the daily legend row (single 4-column grid row) immediately before the day header (line 43)
- Place the weekly legend row immediately after the weekly separator, before the weekly header (line 72)
- When there's no weekly data, only the daily legend shows

---

## 3. Align rollup tooltip with the same structure

The `CalorieTargetRollup.tsx` tooltip currently uses a vertical stacked legend (lines 123-126: "at or under target", "up to 5% over", "more than 5% over"). Refactor it to use the same 4-column grid legend format, placed above each period's equation block.

### Technical detail

In `CalorieTargetRollup.tsx`:
- Replace the stacked legend (lines 122-126) with the same grid pattern used in the calendar tooltip
- Each period block (7 days, 30 days) gets its own legend row above its equation, matching the interleaved pattern from item 2
- For multiplier mode (single shared equation), show one legend row above the equation
- Import and reference the same threshold constants (from item 4)

---

## 4. Extract threshold constants for future configurability

Create named constants for each threshold value so they can be changed in one place.

### Technical detail

In `src/lib/calorie-target.ts`, add:

```typescript
// Daily target dot thresholds (percent over target)
export const DAILY_GREEN_MAX = 2.5;
export const DAILY_AMBER_MAX = 10;

// Weekly/rollup target dot thresholds (percent over target)
export const ROLLUP_GREEN_MAX = 0;
export const ROLLUP_AMBER_MAX = 5;
```

Update `getTargetDotColor` and `getRollupDotColor` to use these constants instead of hardcoded numbers.

Update legend text in both `CalorieTargetTooltipContent.tsx` and `CalorieTargetRollup.tsx` to reference these constants for the displayed threshold labels (e.g., render the `2.5` from `DAILY_GREEN_MAX` rather than hardcoding `"2.5%"`). The "under" label for rollup green stays as "under" since `ROLLUP_GREEN_MAX` is 0.

Update the test file `calorie-target.test.ts` to reference these constants in test descriptions/assertions where appropriate.

### Files changed

| File | Changes |
|------|---------|
| `src/lib/calorie-target.ts` | Add 4 threshold constants; update `getTargetDotColor` and `getRollupDotColor` to use them |
| `src/components/CalorieTargetTooltipContent.tsx` | Fix dot opacity; restructure to interleave legends with sections; use threshold constants for labels |
| `src/components/CalorieTargetRollup.tsx` | Align legend format with calendar tooltip; use threshold constants for labels |
| `src/lib/calorie-target.test.ts` | Import threshold constants for test clarity |


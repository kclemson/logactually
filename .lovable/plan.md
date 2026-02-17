

# Add Weekly Average to Daily Calendar Tooltip

## What changes
When you hover/tap a day in the History calendar, the tooltip currently shows:
1. Day label (e.g. "Mon, Feb 9") at the top
2. The green/amber/rose dot legend
3. The calorie target math equation

The new layout will be:
1. Green/amber/rose dot legend (daily thresholds: 2.5% / 10%)
2. **Day label as a header** (e.g. "Mon, Feb 9: 1,842 cal" with the day's dot color)
3. The daily calorie target math equation
4. *(separator)*
5. **Weekly header** (e.g. "Week of Feb 9-15: 1,923 avg" with a rollup-colored dot)
6. The weekly target math equation (using average burns for that week)
7. Stricter rollup dot legend (at/under / 5% over / 5%+ over)

The weekly section only appears when there are at least 2 days of food data in that week (excluding today).

## Technical details

### 1. `src/lib/calorie-target.ts` -- new `computeWeekRollup` function
Add a function that takes a week start/end date range (as yyyy-MM-dd strings) instead of a trailing window. It filters food totals within that range, excludes today, requires 2+ eligible days, and returns the same `RollupResult` shape. Reuses existing `getRollupDotColor`.

```typescript
export function computeWeekRollup(
  foodTotals: { date: string; totalCalories: number }[],
  weekStart: string,
  weekEnd: string,
  baseTarget: number,
  usesBurns: boolean,
  burnByDate: Map<string, number>,
): RollupResult | null
```

### 2. `src/components/CalorieTargetTooltipContent.tsx` -- restructure layout and add weekly section
- Move the day label from the top to below the legend, styled as a header with the day's intake and dot color
- Add optional props: `weekLabel?: string`, `weekRollup?: RollupResult | null`, `weekTargetComponents?: CalorieTargetComponents | null`, `weekAvgTarget?: number`
- When `weekRollup` is provided and non-null, render a separator line then the weekly summary block with:
  - "Week of Feb 9-15: X,XXX avg" header with rollup dot
  - The weekly equation (same grid pattern, using average burns)
  - The stricter rollup legend (at/under, up to 5%, 5%+)

### 3. `src/pages/History.tsx` -- compute weekly data in `buildDayTooltip`
- Use `startOfWeek(day, { weekStartsOn: settings.weekStartDay ?? 0 })` and `endOfWeek(...)` to determine week boundaries
- Convert the existing `daySummaries` (already fetched for the visible month) into the format needed by `computeWeekRollup`
- Format a week label like "Week of Feb 9-15"
- Pass `weekLabel`, `weekRollup`, and related props to `CalorieTargetTooltipContent`

### 4. `src/lib/calorie-target.test.ts` -- unit tests for `computeWeekRollup`
- Correctly scopes to the given date range
- Excludes today
- Returns null with fewer than 2 eligible days
- Uses rollup dot color thresholds (stricter: 0% / 5%)

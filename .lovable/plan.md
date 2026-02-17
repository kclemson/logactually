

# Rolling Calorie Target Summary on Calendar Page

## What it does

When calorie target is enabled and viewing the current month, a compact summary line appears above the calendar showing average daily intake with a colored dot for the last 7 and 30 days. The dot uses stricter thresholds than the daily dot, since averages over time should not have the same "single bad day" forgiveness.

```text
7 days: 1,842 avg  [dot]     30 days: 1,910 avg  [dot]
```

## Rollup thresholds vs daily thresholds

Daily dot (existing, unchanged):
- Green: at or under target, up to 2.5% over
- Amber: 2.5% to 10% over  
- Rose: more than 10% over

Rollup dot (new, stricter):
- Green: at or under target (0% over)
- Amber: up to 5% over
- Rose: more than 5% over

Rationale: day-to-day variance is normal, but if your weekly average is 5%+ over target, that's a real trend. The tighter thresholds surface this.

## How it works across all three target modes

- **Fixed number**: every day's target is the same static value
- **Exercise adjusted**: each day's target = base goal + that day's logged exercise burn
- **Body stats with fixed activity**: every day's target is the same TDEE-based value
- **Body stats with "Use my exercise logs"**: each day's target = (BMR x 1.2 - deficit) + that day's logged burn

The implementation handles all of these uniformly: `baseTarget` from `getEffectiveDailyTarget(settings)` plus per-day burn from `burnByDate` when `usesActualExerciseBurns` is true.

## Architecture (3 layers)

1. **Pure functions** in `src/lib/calorie-target.ts` -- testable, no React
2. **Tests** in `src/lib/calorie-target.test.ts`
3. **Thin component** `src/components/CalorieTargetRollup.tsx` -- fetches data, calls pure functions, renders
4. **Integration** in `src/pages/History.tsx` -- conditional render

## Technical Details

### File: `src/lib/calorie-target.ts`

Add two new exports:

```typescript
// Stricter thresholds for rolling averages
export function getRollupDotColor(avgCalories: number, avgTarget: number): string {
  const overPercent = ((avgCalories - avgTarget) / avgTarget) * 100;
  if (overPercent <= 0) return "text-green-500 dark:text-green-400";
  if (overPercent <= 5) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}

export interface RollupResult {
  avgIntake: number;
  dotColor: string;
  dayCount: number;
}

export function computeCalorieRollup(
  foodTotals: { date: string; totalCalories: number }[],
  windowDays: number,
  baseTarget: number,
  usesBurns: boolean,
  burnByDate: Map<string, number>,
): RollupResult | null
```

The `computeCalorieRollup` function:
- Computes cutoff date = today minus `windowDays`
- Filters food totals to dates in `[cutoff, yesterday]` (excludes today -- incomplete day skews average)
- Returns null if fewer than 2 eligible days (not enough signal)
- For each eligible day, computes effective target: `baseTarget + burn` if `usesBurns`, else just `baseTarget`
- Averages both intake and target across eligible days
- Returns `{ avgIntake, dotColor: getRollupDotColor(avg, avgTarget), dayCount }`

Adds `format` and `subDays` imports from `date-fns`.

### File: `src/lib/calorie-target.test.ts`

New test suites:

**`getRollupDotColor`:**
- Green when under target
- Green when exactly at target
- Amber when 3% over
- Rose when 6% over

**`computeCalorieRollup`:**
- Returns null with 0-1 days of data
- Correct average and green dot when under target
- Correct rose dot when average is well over
- Excludes today from the window
- Handles exercise-adjusted targets (varying per-day targets via burn map)
- 7-day window only includes last 7 days, not older data

### File: `src/components/CalorieTargetRollup.tsx`

New component (~45 lines):

```typescript
interface CalorieTargetRollupProps {
  settings: UserSettings;
  burnByDate: Map<string, number>;
  usesBurns: boolean;
}
```

- Calls `useDailyFoodTotals(30)` internally for its own data
- Calls `getEffectiveDailyTarget(settings)` for the base target
- Calls `computeCalorieRollup()` twice: once for 7-day, once for 30-day window
- Returns null if base target is null or both windows return null
- If only one window has data (e.g., new user with 4 days), shows only that one
- Renders a single centered row: `text-xs text-muted-foreground`, with a filled circle character for the dot

### File: `src/pages/History.tsx`

- Import `CalorieTargetRollup` and conditionally render between month navigation and calendar
- Only shown when `settings.calorieTargetEnabled` and viewing the current month
- Props: `settings`, `burnByDate`, `usesBurns` (all already available in History)

### Files not changed
- `useDailyFoodTotals.ts` -- used as-is
- `useDailyCalorieBurn` -- already fetched in History
- `useUserSettings` -- used as-is
- `getTargetDotColor` -- daily thresholds stay unchanged


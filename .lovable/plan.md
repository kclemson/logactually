

# Exercise-Adjusted Mode: Dynamic Example + Burn Guard

## What's Changing

Two enhancements to the "Exercise adjusted" calorie target mode in the settings dialog:

1. **A real-data example sentence** showing how the mode works using the user's own logged data, with a colored dot (green/amber/red) matching the calendar indicators.

2. **A warning** when exercise calorie burn estimation is disabled, since the mode can't function without it.

---

## Example Sentence

Below the existing explanation text, a new line will appear (only when data is available):

> *For example, on February 12th you logged 1,850 calories in food and burned ~320 calories exercising, which would show up [colored dot] with a daily calorie target of 1,500 calories.*

- The date is the most recent day where the user has **both** food entries and exercise burn data.
- The burn number is prefixed with `~` since it's an estimate (midpoint of the low/high range).
- The colored dot uses the same green/amber/red logic already used on the calendar.
- If no qualifying day exists or no target is set, the example simply won't appear.

## Burn-Disabled Guard

If exercise calorie burn estimation is turned off, the target input and example are hidden and replaced with:

> *Exercise calorie burn estimation is currently disabled. Enable it in Estimated Calorie Burn settings for this mode to work.*

---

## Technical Details

### New File: `src/hooks/useDailyFoodTotals.ts`

A lightweight React Query hook that returns daily calorie totals, paralleling the existing `useDailyCalorieBurn` hook:

- Queries `food_entries` with `SELECT eaten_date, SUM(total_calories)` grouped by date, filtered to the last N days
- Returns `{ date: string; totalCalories: number }[]`
- Uses 5-minute stale time (matching existing patterns)
- Much lighter than `useRecentFoodEntries` -- no item parsing, just date + sum

### Modified File: `src/components/CalorieTargetDialog.tsx`

**New imports:**
- `useDailyFoodTotals` from the new hook
- `format` from `date-fns` for "February 12th" formatting
- `getTargetDotColor` from `calorie-target.ts`

**New `useMemo` for example data:**
- Call `useDailyFoodTotals(30)` alongside the existing `useDailyCalorieBurn(30)`
- Walk backward from today to find the most recent date present in both datasets
- Compute: `foodCals`, `burnCals` (midpoint of low/high), `net = foodCals - burnCals`
- Get dot color class via `getTargetDotColor(net, target)`
- Format date as "February 12th" using `format(date, 'MMMM do')`
- Return `null` if no qualifying day or no target set

**Exercise-adjusted section changes (lines 289-313):**

```tsx
{settings.calorieTargetMode === 'exercise_adjusted' && (
  <div className="space-y-3">
    {!settings.calorieBurnEnabled ? (
      <p className="text-[10px] text-amber-500 dark:text-amber-400 italic">
        Exercise calorie burn estimation is currently disabled. Enable it in
        Estimated Calorie Burn settings for this mode to work.
      </p>
    ) : (
      <>
        {/* Target input (existing) */}
        <div className="flex items-center justify-between">...</div>

        {/* Existing explanation */}
        <p className="text-[10px] text-muted-foreground/70">
          Calories burned from logged exercises are subtracted...
        </p>

        {/* NEW: Dynamic example */}
        {exampleData && settings.dailyCalorieTarget && (
          <p className="text-[10px] text-muted-foreground/70 italic">
            For example, on {exampleData.dateFormatted} you logged{' '}
            {exampleData.foodCals.toLocaleString()} calories in food and
            burned ~{exampleData.burnCals.toLocaleString()} calories
            exercising, which would show up{' '}
            <span className={exampleData.dotColorClass}>●</span> with a
            daily calorie target of{' '}
            {settings.dailyCalorieTarget.toLocaleString()} calories.
          </p>
        )}
      </>
    )}
  </div>
)}
```

### No other files affected
- `getTargetDotColor` already exists in `src/lib/calorie-target.ts`
- No database changes needed -- querying existing `food_entries` table


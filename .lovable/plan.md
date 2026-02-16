

# Fix: Activity level hint should show regardless of calorie burn toggle

## Problem

The activity level suggestion ("Your logged exercise burned an average of ~N calories/day over N active days. This is closest to [Level].") no longer appears in the "Estimated burn rate minus a deficit" mode.

**Root cause:** The `useDailyCalorieBurn` hook checks `settings.calorieBurnEnabled` and returns an empty array when it's `false`. The activity hint depends on this data, so it silently disappears whenever the user has the calorie burn estimation feature turned off -- even though the hint is conceptually independent.

## Solution

The `CalorieTargetDialog` needs its own burn data that isn't gated by `calorieBurnEnabled`. Two options:

1. **Add a parameter to `useDailyCalorieBurn`** to bypass the enabled check (e.g., `useDailyCalorieBurn(30, { ignoreEnabledCheck: true })`)
2. **Duplicate the minimal logic** inline in the dialog

Option 1 is cleaner. We'll add an optional `force` flag to `useDailyCalorieBurn` so the dialog can request burn data even when the feature is toggled off.

## Technical Details

### File: `src/hooks/useDailyCalorieBurn.ts`

- Add an optional `options` parameter: `useDailyCalorieBurn(days: number, options?: { force?: boolean })`
- Change the early-return guard from `if (!settings.calorieBurnEnabled) return [];` to `if (!settings.calorieBurnEnabled && !options?.force) return [];`

### File: `src/components/CalorieTargetDialog.tsx`

- Change the call from `useDailyCalorieBurn(30)` to `useDailyCalorieBurn(30, { force: true })` so the activity hint (and exercise-adjusted example) always have data to work with, regardless of the burn toggle state.

No other files are affected. The existing callers of `useDailyCalorieBurn` without the `force` flag continue to behave exactly as before.

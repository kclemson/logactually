
# Remove `exerciseAdjustedBase` -- Use `dailyCalorieTarget` for Both Modes

Since exercise-adjusted mode hasn't shipped to production, we can cleanly remove the separate field entirely.

## Changes

### 1. `src/hooks/useUserSettings.ts`
- Remove `exerciseAdjustedBase` from the `UserSettings` interface
- Remove it from `DEFAULT_SETTINGS`

### 2. `src/lib/calorie-target.ts`
- Change the `exercise_adjusted` branch in `getEffectiveDailyTarget` to return `settings.dailyCalorieTarget`
- Update JSDoc to reflect the change

### 3. `src/components/CalorieTargetDialog.tsx`
- In the exercise-adjusted input: bind to `dailyCalorieTarget` instead of `exerciseAdjustedBase`
- In the disable/reset handler: remove `exerciseAdjustedBase: null`

### 4. `src/pages/Trends.tsx`
- Remove the two special-case branches that read `exerciseAdjustedBase`; just use `getEffectiveDailyTarget(settings)` for both reference lines (it now returns `dailyCalorieTarget` for exercise-adjusted mode too)

### 5. `src/lib/calorie-target.test.ts`
- Update the two exercise-adjusted test cases to use `dailyCalorieTarget` instead of `exerciseAdjustedBase`

### 6. `src/pages/Settings.test.tsx`
- Remove `exerciseAdjustedBase` from the mock settings objects

## Result
Switching between "Fixed number" and "Exercise adjusted" preserves the target value automatically since both read from the same field.

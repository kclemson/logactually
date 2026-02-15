

# Revamp Calorie Target: Mode Dropdown, Inline Biometrics, Exercise-Adjusted Mode

## Summary

Rename the internal mode key from `'deficit'` to `'body_stats'`, replace the button toggle with a dropdown that shows descriptions inline, embed biometric inputs directly in the dialog (no more "set your body stats" gate), and add a new "Exercise adjusted" mode that uses actual daily exercise burn. No database migration needed.

---

## Production Safety

- No user in production has `calorieTargetMode` set to `'deficit'` (confirmed via database query -- only the dev account has it).
- A lightweight client-side shim will map any stale `'deficit'` value to `'body_stats'` at read time, which self-heals on next save.
- The new `exerciseAdjustedBase` field defaults to `null` via `DEFAULT_SETTINGS` spread, so existing users are unaffected.
- No database migration required -- all settings live in the `profiles.settings` JSONB column.

---

## Changes by File

### `src/hooks/useUserSettings.ts`
- Change type: `calorieTargetMode: 'static' | 'body_stats' | 'exercise_adjusted'`
- Add field: `exerciseAdjustedBase: number | null` (default `null`)
- Add shim in `queryFn` after the spread to map legacy `'deficit'` to `'body_stats'`

### `src/lib/calorie-target.ts`
- Add `TARGET_MODE_OPTIONS` constant array:
  - `static` / "Fixed number" / "You set a specific calorie number"
  - `body_stats` / "Estimated from body stats" / "Calculated from your weight, height, and activity level"
  - `exercise_adjusted` / "Exercise adjusted" / "Your base goal plus actual calories burned each day"
- Update `getEffectiveDailyTarget` to handle all three modes explicitly:
  - `'static'`: returns `dailyCalorieTarget` (unchanged)
  - `'body_stats'`: BMR x activity - deficit (same logic as old `'deficit'`)
  - `'exercise_adjusted'`: returns `exerciseAdjustedBase` (per-day adjustment happens at consumption sites)
- Add `getExerciseAdjustedTarget(base: number, dailyBurn: number): number`

### `src/lib/calorie-target.test.ts`
- Add `exerciseAdjustedBase: null` to `baseSettings`
- Rename `'deficit'` references to `'body_stats'`
- Add tests for exercise-adjusted mode and the new helper

### New: `src/components/BiometricsInputs.tsx`
Extract from `CalorieBurnDialog.tsx` (lines ~159-471) into a shared component:
- Local state: `bodyWeightUnit`, `heightDisplay`
- Handlers: `handleWeightChange`, `displayWeight`, `handleBodyWeightUnitChange`, `parseFeetInchesInput`, `handleHeightChange`, `handleHeightUnitChange`, `handleAgeChange`
- `compositionOptions` array
- All four input rows: body weight (with lbs/kg toggle), height (with ft/cm toggle), age, metabolic profile
- Props: `settings: UserSettings`, `updateSettings: (updates: Partial<UserSettings>) => void`

### `src/components/CalorieBurnDialog.tsx`
- Import and render `BiometricsInputs` inside the "Your info" section
- Remove the extracted local state, handlers, helpers, and input markup (~lines 84-86, 159-300, 360-471)
- Keep: toggle, preview section header, "Workout defaults" section (default intensity)

### `src/components/CalorieTargetDialog.tsx`
Major rework of the config body:

**Mode selector**: Replace button toggle with Radix `Select`. Each `SelectItem` renders two lines -- bold label on top, muted description below (matching the saved meals popover pattern). Import `TARGET_MODE_OPTIONS` from `calorie-target.ts`.

**Fixed number mode** (`static`): Number input for target (unchanged).

**Estimated from body stats mode** (`body_stats`):
- Render `BiometricsInputs` inline (replaces the "Set your body stats" warning and the CalorieBurnDialog sub-dialog)
- Activity level dropdown (unchanged)
- Activity hint reworded: "Average ~193 calories/day burned over 27 active days. This is closest to "Lightly active.""
- Daily deficit input (unchanged)
- Summary reworded: "Base metabolic rate ~1,248 x 1.375 = ~1,716 daily energy expenditure - 500 = 1,216 cal/day"

**Exercise adjusted mode** (`exercise_adjusted`):
- Base goal input (number, same styling as fixed number)
- Explanation: "Your daily target increases by calories burned from logged exercises"
- Render `BiometricsInputs` inline (calorie burn estimation needs body stats)
- Note if `calorieBurnEnabled` is false, suggesting they enable it

**Toggle-off reset**: Clear new fields too (`exerciseAdjustedBase: null`).

Remove: `CalorieBurnDialog` import and sub-dialog state, `hasBiometrics` gate, `calorieBurnDialogOpen` state.

### `src/pages/History.tsx`
- Import `useDailyCalorieBurn` and `getExerciseAdjustedTarget`
- When `settings.calorieTargetMode === 'exercise_adjusted'`:
  - Call `useDailyCalorieBurn` for the visible month range (pass appropriate day count)
  - Build a `Map<string, number>` from date to midpoint burn `(low + high) / 2`
  - In the calendar cell render (line ~252), compute adjusted target: `getExerciseAdjustedTarget(base, burnMap.get(dateStr) ?? 0)`
  - Pass adjusted target to `getTargetDotColor`
- For `'static'` and `'body_stats'` modes: unchanged (still calls `getEffectiveDailyTarget(settings)`)

### `src/pages/FoodLog.tsx`
- Import `useDailyCalorieBurn` and `getExerciseAdjustedTarget`
- When `exercise_adjusted`: look up the selected day's burn from `useDailyCalorieBurn` data, compute `getExerciseAdjustedTarget(base, midpoint)`
- Pass adjusted target to `FoodItemsTable` via `dailyCalorieTarget` prop
- For other modes: unchanged

### `src/pages/Trends.tsx`
- When `exercise_adjusted`: use `settings.exerciseAdjustedBase` as the reference line value (base goal, since daily target varies per day)
- For other modes: unchanged (uses `getEffectiveDailyTarget(settings)`)

### `src/pages/Settings.test.tsx`
- Add `exerciseAdjustedBase: null` to mock settings objects
- `calorieTargetMode` stays `'static'` in mocks (no change needed there)

---

## What Stays the Same

- `dailyDeficit` field name (accurately describes the value for body_stats mode)
- `dailyCalorieTarget` field for static mode
- `getTargetDotColor` function and its thresholds
- All calorie burn estimation logic (`computeAbsoluteBMR`, `estimateCalorieBurn`, etc.)
- Enable/disable toggle behavior
- `FoodItemsTable` component (just receives a different target value from its parent)


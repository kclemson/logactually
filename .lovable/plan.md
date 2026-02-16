

# Add "Use my exercise logs" to Activity Level dropdown

## Overview

Add a fifth option to the existing Activity Level dropdown in the "Estimated burn rate minus a deficit" mode. When selected, the daily target becomes variable: `BMR + actual logged exercise burns - deficit` instead of the fixed `BMR x multiplier - deficit`.

## What Changes for the User

The Activity Level dropdown gains a new option at the bottom:

```text
Sedentary              x1.2
Lightly active         x1.375
Moderately active      x1.55
Active                 x1.725
Use my exercise logs
```

When "Use my exercise logs" is selected:
- The activity hint ("Your logged exercise burned an average of...") is hidden
- The equation breakdown changes to show the dynamic formula
- A warning appears if calorie burn estimation is disabled
- The deficit input remains (still useful: "eat X below what I burn")

The equation breakdown becomes:

```text
Base metabolic rate (BMR):
180 lbs, 5'10", 35 years, Male = 1,650

Daily calorie target:
1,650 + logged exercise (varies daily) - 500
```

No value after the formula since it changes each day based on what exercise was logged.

## Technical Details

### 1. Expand ActivityLevel type and labels (`src/lib/calorie-target.ts`)

- Add `'logged'` to the `ActivityLevel` union type
- Add entry to `ACTIVITY_LABELS` with label "Use my exercise logs" and no multiplier
- Update `computeTDEE` to handle `'logged'` (not called for this path, but type-safe)
- Update `getEffectiveDailyTarget`: when `activityLevel === 'logged'`, return `Math.round(bmr - deficit)` (the actual burn is added downstream)
- Add a new helper function:

```typescript
export function usesActualExerciseBurns(settings: UserSettings): boolean {
  return settings.calorieTargetMode === 'exercise_adjusted' ||
    (settings.calorieTargetMode === 'body_stats' && settings.activityLevel === 'logged');
}
```

### 2. Update UserSettings type (`src/hooks/useUserSettings.ts`)

Expand `activityLevel` type to include `'logged'`:

```typescript
activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'logged' | null;
```

### 3. Update CalorieTargetDialog UI (`src/components/CalorieTargetDialog.tsx`)

- Add "Use my exercise logs" as the fifth option in the Activity Level Select dropdown (rendered differently from the multiplier-based options -- no "x1.375" suffix)
- When `activityLevel === 'logged'`:
  - Hide the activity hint paragraph
  - Show calorie burn disabled warning if `calorieBurnEnabled` is false
  - Update equation breakdown: replace the TDEE line with "BMR + logged exercise (varies daily)" and show the target line as "BMR + logged exercise (varies daily) - deficit" without a computed result

### 4. Update downstream consumption (`src/pages/FoodLog.tsx` and `src/pages/History.tsx`)

Replace all `settings.calorieTargetMode === 'exercise_adjusted'` checks with the new `usesActualExerciseBurns(settings)` helper. This ensures actual burn data is fetched and applied when either exercise_adjusted mode or body_stats + logged is active. Affected locations:

- **FoodLog.tsx** (lines 98, 101, 722): burn data fetching and target computation
- **History.tsx** (lines 65, 71, 280): burn map building and calendar dot coloring

### 5. Tests (`src/lib/calorie-target.test.ts`)

- `getEffectiveDailyTarget` with `body_stats` + `activityLevel: 'logged'` returns `Math.round(BMR - deficit)`
- `getEffectiveDailyTarget` with `body_stats` + `activityLevel: 'logged'` returns null when body weight is missing
- `getEffectiveDailyTarget` with `body_stats` + `activityLevel: 'logged'` does NOT require a multiplier
- `usesActualExerciseBurns` returns true for `exercise_adjusted` mode
- `usesActualExerciseBurns` returns true for `body_stats` + `activityLevel: 'logged'`
- `usesActualExerciseBurns` returns false for `body_stats` + `activityLevel: 'light'`

### Files modified

| File | Change |
|---|---|
| `src/lib/calorie-target.ts` | Expand `ActivityLevel` type, update `body_stats` branch, add `usesActualExerciseBurns` helper |
| `src/hooks/useUserSettings.ts` | Expand `activityLevel` type to include `'logged'` |
| `src/components/CalorieTargetDialog.tsx` | Add dropdown option, conditional equation/warning UI |
| `src/pages/FoodLog.tsx` | Use `usesActualExerciseBurns()` instead of direct mode check |
| `src/pages/History.tsx` | Use `usesActualExerciseBurns()` instead of direct mode check |
| `src/lib/calorie-target.test.ts` | Add test cases for new paths and helper |


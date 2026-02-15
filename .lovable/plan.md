

# TDEE-Based Dynamic Calorie Target (Deficit Mode)

## Overview

Add an optional "deficit mode" to the Daily Calorie Target setting. Instead of a static number, users set an activity level and deficit amount. The app computes:

```text
Target = TDEE - deficit
TDEE   = BMR x activity_multiplier
```

All biometric data is reused from the existing calorie burn settings -- zero redundancy.

## Naming Convention

All function and variable names will use fully capitalized acronyms: `BMR`, `TDEE` (not `Bmr`, `Tdee`).

- `computeAbsoluteBMR()` (not `computeAbsoluteBmr`)
- `computeTDEE()` (not `computeTdee`)

## Architecture

Shared BMR logic is extracted from `calorie-burn.ts` so both features use the same computation:

```text
calorie-burn.ts                     calorie-target.ts
       |                                    |
  getBmrScalingFactor()             computeTDEE()
       |                                    |
       +----> computeAbsoluteBMR() <--------+
               (shared, extracted)
```

A single `getEffectiveDailyTarget(settings)` resolver replaces all 4 current consumers of `settings.dailyCalorieTarget`. It returns `number | null` -- same shape -- so dot-color and reference-line logic works unchanged.

## User Experience

The "Daily Calorie Target" row in Settings becomes a mode picker:

- **Static** (current behavior): number input, e.g., 2000
- **Deficit**: activity level dropdown + deficit amount input

When Deficit is selected, the UI shows:

1. Activity level dropdown: Sedentary (x1.2), Lightly active (x1.375), Moderately active (x1.55), Active (x1.725)
2. Daily deficit input (e.g., 500)
3. Computed summary: `BMR ~1,650 x 1.375 = ~2,269 TDEE - 500 = ~1,769 cal/day`
4. Activity hint from logged data: "Based on your last 30 days: avg ~250 cal/day burned -- closest to Lightly active"

If biometrics are missing, a note directs users to the calorie burn config dialog.

## Technical Details

### 1. Extract shared BMR (`src/lib/calorie-burn.ts`)

New exported function:

```typescript
export function computeAbsoluteBMR(settings: {
  bodyWeightLbs: number | null;
  heightInches: number | null;
  age: number | null;
  bodyComposition: 'female' | 'male' | null;
}): number | null
```

Returns null if weight is missing. `getBmrScalingFactor()` is refactored to call this -- no behavior change.

### 2. New settings fields (`src/hooks/useUserSettings.ts`)

```typescript
calorieTargetMode: 'static' | 'deficit';   // default: 'static'
activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | null;  // default: null
dailyDeficit: number | null;                // default: null
```

### 3. TDEE and target resolution (`src/lib/calorie-target.ts`)

New exports alongside existing `getTargetDotColor`:

- `ACTIVITY_MULTIPLIERS` -- constant map of level to multiplier
- `computeTDEE(bmr, activityLevel)` -- simple multiplication
- `getEffectiveDailyTarget(settings)` -- resolves final target:
  - Static mode: returns `settings.dailyCalorieTarget`
  - Deficit mode: `BMR x multiplier - deficit`, null if biometrics missing
- `suggestActivityLevel(avgDailyBurn)` -- maps average daily burn to closest tier

### 4. Update all consumers (4 files)

Replace `settings.dailyCalorieTarget` with `getEffectiveDailyTarget(settings)`:

| File | Usage |
|------|-------|
| `src/pages/History.tsx` | Calendar dot color (line 251) |
| `src/pages/FoodLog.tsx` | Passes to FoodItemsTable (line 706) |
| `src/components/FoodItemsTable.tsx` | Totals row dot color (line 336) |
| `src/pages/Trends.tsx` | Chart reference line (lines 323, 357) |

Each is a one-line swap -- the resolver returns `number | null`, same shape as the raw field.

### 5. Settings UI (`src/components/settings/PreferencesSection.tsx`)

- Replace static number input with a Static/Deficit toggle (same button style as weight units)
- Static: show existing number input
- Deficit: show activity level dropdown (Radix Select) + deficit number input + computed summary + activity hint
- Activity hint uses `useDailyCalorieBurn(30)` average + `suggestActivityLevel()`

### 6. Test update (`src/pages/Settings.test.tsx`)

Add new default fields to mock settings objects.

### Files changed

| File | What |
|------|------|
| `src/lib/calorie-burn.ts` | Extract `computeAbsoluteBMR()`, refactor `getBmrScalingFactor` to use it |
| `src/lib/calorie-target.ts` | Add `computeTDEE`, `getEffectiveDailyTarget`, `ACTIVITY_MULTIPLIERS`, `suggestActivityLevel` |
| `src/hooks/useUserSettings.ts` | Add 3 new settings fields with defaults |
| `src/components/settings/PreferencesSection.tsx` | Mode toggle, activity dropdown, deficit input, summary, hint |
| `src/pages/History.tsx` | Use `getEffectiveDailyTarget()` |
| `src/pages/FoodLog.tsx` | Use `getEffectiveDailyTarget()` |
| `src/components/FoodItemsTable.tsx` | Use `getEffectiveDailyTarget()` |
| `src/pages/Trends.tsx` | Use `getEffectiveDailyTarget()` |
| `src/pages/Settings.test.tsx` | Add new defaults to mock |


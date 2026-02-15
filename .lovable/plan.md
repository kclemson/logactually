

# Calorie Target: Dialog with Enable Toggle

## Overview

Move all Daily Calorie Target configuration out of PreferencesSection's inline UI into a dedicated `CalorieTargetDialog`, following the exact same pattern as `CalorieBurnDialog`: a master enable toggle at the top, with all config revealed below when enabled.

## New Setting Field

Add `calorieTargetEnabled: boolean` (default `false`) to `UserSettings`. This is the single source of truth for whether the feature is active — cleaner than inferring from `dailyCalorieTarget != null || calorieTargetMode === 'deficit'`.

`getEffectiveDailyTarget()` gains a guard: if `!settings.calorieTargetEnabled`, return `null`. All existing consumers already handle null, so no further changes needed.

## Settings Row (PreferencesSection)

Replace the entire inline calorie target block (mode toggle, static input, deficit section) with a single compact row matching the calorie burn pattern:

```
Daily Calorie Target                              [Configure] / [Set up]
Show colored indicators on calendar
```

- "Configure" when `calorieTargetEnabled` is true, "Set up" when false
- Optionally show a small summary below the label when configured (e.g., "2,000 cal/day" or "~1,769 cal/day (deficit)")

Remove from PreferencesSection: `useDailyCalorieBurn` hook, TDEE/BMR computations, Select imports, activity level constants, mode toggle buttons, static input, deficit inline section.

## CalorieTargetDialog (New File)

Follows CalorieBurnDialog structure exactly:

**Props**: `open`, `onOpenChange`, `settings`, `updateSettings` (same interface)

**Layout**:
1. Toggle row at top: "Daily calorie target" with on/off switch
2. Below toggle, wrapped in the same `grid-rows-[1fr]/grid-rows-[0fr]` CSS transition used by CalorieBurnDialog:
   - Mode toggle: Static | Deficit (button pair)
   - Static mode: single number input
   - Deficit mode: activity level dropdown, deficit input, TDEE summary, 30-day activity hint
   - If biometrics missing in deficit mode: link to open CalorieBurnDialog

**Toggle disable behavior**: Clears target settings (`calorieTargetEnabled: false, dailyCalorieTarget: null, calorieTargetMode: 'static', activityLevel: null, dailyDeficit: null`) and closes dialog via `onOpenChange(false)`.

**Mobile safety**: Reuses CalorieBurnDialog's exact `DialogContent` classes (`left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto`, `onInteractOutside` prevention) to avoid the keyboard-push bug.

**Data fetching**: Calls `useDailyCalorieBurn(30)` internally for the activity hint (only when dialog is mounted, since it's conditionally rendered).

**Nested dialog**: Can open CalorieBurnDialog from within if biometrics are missing (same conditional render pattern).

## Technical Details

### Files changed

| File | What |
|------|------|
| `src/hooks/useUserSettings.ts` | Add `calorieTargetEnabled: boolean` field (default `false`) |
| `src/lib/calorie-target.ts` | Add early-return guard in `getEffectiveDailyTarget`: if `!calorieTargetEnabled`, return null |
| `src/lib/calorie-target.test.ts` | Update tests to include `calorieTargetEnabled` in test settings |
| `src/components/CalorieTargetDialog.tsx` | New dialog with enable toggle + all calorie target config (mode toggle, static input, deficit config, TDEE summary, activity hint, nested CalorieBurnDialog trigger) |
| `src/components/settings/PreferencesSection.tsx` | Replace inline config with single row + dialog trigger; remove `useDailyCalorieBurn`, Select imports, TDEE/BMR computation, mode toggle, inline inputs |
| `src/pages/Settings.test.tsx` | Add `calorieTargetEnabled` to mock settings |

### Architecture notes

- All TDEE/BMR computation logic stays in `src/lib/calorie-target.ts` and `src/lib/calorie-burn.ts` (shared libs) -- the dialog only calls these, doesn't duplicate them
- `getEffectiveDailyTarget()` remains the single resolver used by all 4 consumers (History, FoodLog, FoodItemsTable, Trends) -- no consumer changes needed
- The dialog owns its own `useDailyCalorieBurn(30)` call, scoped to when it's mounted (conditional render means no wasted fetches)
- The enable/disable toggle follows the same "clear all related settings on disable" pattern as CalorieBurnDialog's toggle

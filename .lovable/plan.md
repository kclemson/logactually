

# Show calorie target dot on today (Food Log + Calendar)

## Summary

Remove the "not today" exclusion so the colored calorie-target dot appears on the current day in both views. Since the tooltip now provides context about targets, users benefit from seeing the dot even for an in-progress day.

## Changes

### 1. Food Log (`src/pages/FoodLog.tsx`, line 739)

Change `showCalorieTargetDot={!isTodaySelected}` to `showCalorieTargetDot={true}` (or simply remove the today guard).

### 2. Calendar (`src/pages/History.tsx`)

Three spots where `!isTodayDate` suppresses the dot:

- **Line 217** (in `handleDayClick`): Change `const hasDot = !!summary && !isTodayDate && baseTarget != null && baseTarget > 0` -- remove `!isTodayDate`
- **Line 334** (in render): Same change for `const hasDot = hasEntries && !isTodayDate && baseTarget != null && baseTarget > 0`
- **Line 371** (inline dot render): Change `return !isTodayDate && target && target > 0 ?` to `return target && target > 0 ?`

All three removals ensure the dot and tooltip appear on today's cell in the calendar grid, consistent with the Food Log change.


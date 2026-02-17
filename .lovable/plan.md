
# Reuse calendar tooltip on Food Log total row

## Goal

When hovering the calorie value in the Food Log's Total row, show the exact same tooltip content currently shown on hover of a calendar day cell in the History page.

## Approach

### 1. Extract shared tooltip content into a reusable component

Create `src/components/CalorieTargetTooltipContent.tsx` that renders the tooltip body currently built by `buildDayTooltip` in `History.tsx`.

Props:
- `label` (string) -- e.g. "Wed, Feb 12" or "Total"
- `intake` (number) -- total calories consumed
- `target` (number) -- the effective calorie target for the day
- `burn` (number) -- exercise burn for the day (0 when not applicable)
- `targetComponents` (from `getCalorieTargetComponents`) -- determines which equation layout to show

The component renders the dot-color legend, the equation grid, and the total line -- identical to the current `buildDayTooltip` output.

### 2. Update History.tsx to use the shared component

Replace the inline `buildDayTooltip` JSX with a call to `CalorieTargetTooltipContent`, passing the same values it currently computes.

### 3. Add tooltip to TotalsRow in FoodItemsTable

- Add two new props to `FoodItemsTable`: `dailyBurn` (number) and `calorieTargetComponents` (from calorie-target.ts)
- In `TotalsRow`, wrap the calorie number + dot in a Radix `Tooltip` that renders `CalorieTargetTooltipContent`
- Only show when `showCalorieTargetDot` is true and `dailyCalorieTarget` is set

### 4. Pass the new props from FoodLog.tsx

Pass `dailyBurn={dailyBurnForSelectedDay}` and `calorieTargetComponents={getCalorieTargetComponents(settings)}` to the main `FoodItemsTable` instance (not the SaveMealDialog one).

## Technical details

**New file:** `src/components/CalorieTargetTooltipContent.tsx`
- Pure presentational component, no hooks
- Imports `CalorieTargetComponents` type from `calorie-target.ts`

**Modified files:**
- `src/pages/History.tsx` -- replace `buildDayTooltip` body with `CalorieTargetTooltipContent`
- `src/components/FoodItemsTable.tsx` -- add tooltip around calorie total, accept new props
- `src/pages/FoodLog.tsx` -- pass `dailyBurn` and `calorieTargetComponents` props

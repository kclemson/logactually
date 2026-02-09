

## Add Calorie Target Dot to Food Log Totals Row

### What Changes

On non-today days that have food logged, the totals row in the food log will show the same colored dot indicator next to the calorie total -- matching the History calendar's behavior.

### Technical Details

**File: `src/components/FoodItemsTable.tsx`**

1. Add two new optional props:
   - `dailyCalorieTarget?: number` -- the user's target (0 or undefined means no target)
   - `showCalorieTargetDot?: boolean` -- whether to render the dot (caller controls the "not today" logic)

2. Import `getTargetDotColor` from `src/pages/History.tsx` (extract to shared location first).

3. In the `TotalsRow` component (line 323), after the calorie number, conditionally render the dot span using the same styling as History (`text-[10px] ml-0.5 leading-none relative top-[-0.5px]`).

**File: `src/lib/calorie-target.ts`** (new file)

Extract `getTargetDotColor` from `src/pages/History.tsx` into a shared utility so both History and FoodItemsTable use the same logic.

**File: `src/pages/History.tsx`**

Import `getTargetDotColor` from the new shared utility instead of defining it locally.

**File: `src/pages/FoodLog.tsx`**

Pass the two new props to `FoodItemsTable` (line 736-754):
- `dailyCalorieTarget={settings.dailyCalorieTarget}`
- `showCalorieTargetDot={!isTodaySelected && displayItems.length > 0}`

The `displayItems.length > 0` check is already handled by the conditional rendering on line 735, so really just `!isTodaySelected` suffices.

### Summary of Changes

| File | Change |
|------|--------|
| `src/lib/calorie-target.ts` | New file: extract `getTargetDotColor` helper |
| `src/pages/History.tsx` | Import `getTargetDotColor` from shared util |
| `src/components/FoodItemsTable.tsx` | Add two props, render dot in TotalsRow |
| `src/pages/FoodLog.tsx` | Pass target and dot-visibility props |


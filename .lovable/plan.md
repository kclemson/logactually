

# Group Portion Scaling — Reuse `scalePortion` for Display

## Problem
The group header currently hardcodes "(1 portion)". After scaling, it should show the cumulative result (e.g., "(0.5 portions)", "(2 portions)") using the same `scalePortion()` function that individual items already use for natural pluralization.

## Approach

### 1. Database migration
Add `group_portion_multiplier REAL DEFAULT 1.0` to `food_entries`. This stores the cumulative multiplier so the label persists after save/reload.

### 2. `src/types/food.ts`
Add `group_portion_multiplier: number | null` to the `FoodEntry` interface.

### 3. `src/hooks/useFoodEntries.ts`
Include `group_portion_multiplier` in the `createEntry` mutation (default 1.0).

### 4. `src/components/FoodItemsTable.tsx`

**Display label**: Replace the hardcoded `(1 portion)` with a call to `scalePortion("1 portion", cumulativeMultiplier)`. This reuses the existing pluralization logic:
- multiplier 1.0 displays "(1 portion)"
- multiplier 0.5 displays "(0.5 portions)"
- multiplier 2.0 displays "(2 portions)"

This applies in both locations (expanded group header ~line 378 and collapsed group header ~line 816).

**New prop**: `entryPortionMultipliers?: Map<string, number>` to look up the stored cumulative multiplier per entry.

**Stepper "Done" handler**: When the user hits "Done":
1. Scale all sub-items by the stepper multiplier (same as today).
2. Compute the new cumulative multiplier: `(existingMultiplier) * stepperMultiplier`.
3. Call a new `onUpdateEntryPortionMultiplier(entryId, newCumulative)` callback to persist it.
4. Reset stepper to 1.0 (as today).

**Preview text**: During active scaling, the preview already shows `({Math.round(groupCalories * groupPortionMultiplier)} cal)`. Add the scaled portion label too: `(scalePortion("1 portion", cumulative * stepper), X cal)` for consistency with individual items.

### 5. `src/pages/FoodLog.tsx`

- Build `entryPortionMultipliers` map from entries data, pass to `FoodItemsTable`.
- Add `handleUpdateEntryPortionMultiplier` handler that calls `updateEntry` with the new `group_portion_multiplier` value.

### Files summary

| File | Change |
|------|--------|
| Database migration | Add `group_portion_multiplier REAL DEFAULT 1.0` to `food_entries` |
| `src/types/food.ts` | Add `group_portion_multiplier` to `FoodEntry` |
| `src/hooks/useFoodEntries.ts` | Include `group_portion_multiplier` in create mutation |
| `src/pages/FoodLog.tsx` | Build multiplier map + add update handler, pass both to table |
| `src/components/FoodItemsTable.tsx` | Use `scalePortion("1 portion", cumulative)` for label; persist cumulative on Done; new props for multiplier map and update callback |


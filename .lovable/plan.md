# Completed: Simplify Source ID Checking for Saved Meals/Routines

**Status:** ✅ Implemented

## Summary

Simplified the source ID checking logic in both food and weight logging by passing source ID sets directly to the table components. This separates the logic (ID-based) from the display (name-based), fixing bugs and improving robustness.

## Changes Made

1. **WeightItemsTable.tsx** - Added `entrySourceRoutineIds` prop and updated expanded section logic
2. **WeightLog.tsx** - Built `entrySourceRoutineIds` set and passed it to the table
3. **FoodItemsTable.tsx** - Added `entrySourceMealIds` prop and updated expanded section logic
4. **FoodLog.tsx** - Built `entrySourceMealIds` set and passed it to the table

## Benefits

1. **Fixed duplicate text bug** - Raw input is hidden when `sourceRoutineId`/`source_meal_id` exists
2. **Handles deleted sources gracefully** - Shows "(deleted)" instead of incorrectly offering "Save as"
3. **Clearer mental model** - ID determines behavior, name is cosmetic display data
4. **More robust** - Works correctly even if saved items query is stale or slow

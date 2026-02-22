

# Fix: Use estimated calorie burn as fallback in chart data

## Problem
The compare subtraction code is working correctly, but the exercise `calories_burned` daily totals are always 0 for most entries. This is because `rowCaloriesBurned` on line 218 of `chart-data.ts` uses:

```
calories_burned_override ?? meta?.calories_burned ?? 0
```

It never falls back to `calories_burned_estimate`, which is the auto-computed value that exists for virtually all entries. So the subtraction `foodCalories - 0 = foodCalories` changes nothing.

## Fix

**File: `src/lib/chart-data.ts` (line 218)**

Change the fallback chain to include the estimate column:

```typescript
const rowCaloriesBurned = row.calories_burned_override ?? row.calories_burned_estimate ?? meta?.calories_burned ?? 0;
```

This prefers manual overrides when present, falls back to the auto-computed estimate, and only uses the legacy JSONB metadata field as a last resort.

## Impact
- "Net Daily Calories" charts will now correctly subtract exercise calories
- All other exercise calorie charts will also show more complete data (estimates instead of just manual values)
- No breaking changes: manual overrides still take priority


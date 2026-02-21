
# Fix: DetailDialog not showing calories burned + audit all calories_burned references

## Problem
The DetailDialog's `flattenExerciseValues` function reads `item['calories_burned']` but the WeightSet property is `calories_burned_override`. Since `exercise_metadata` is now stripped of promoted keys, the JSONB fallback also returns nothing.

## Changes

### 1. DetailDialog.tsx -- flattenExerciseValues (line 798)

Use the existing `META_KEY_TO_COLUMN` mapping to resolve the correct property name:

```typescript
// Before (line 798):
flat[`_meta_${mk.key}`] = item[mk.key] ?? metadata[mk.key] ?? null;

// After:
const columnName = META_KEY_TO_COLUMN[mk.key] || mk.key;
flat[`_meta_${mk.key}`] = item[columnName] ?? metadata[mk.key] ?? null;
```

This is a one-line change. It correctly maps `calories_burned` to `calories_burned_override` while all other keys (effort, heart_rate, etc.) map to themselves.

### 2. Audit of all other calories_burned references

All other usages are already correct:

- **calorie-burn.ts** (line 348): reads `exercise.calories_burned_override` -- correct
- **csv-export.ts** (line 191): reads `set.calories_burned_override` -- correct
- **chart-data.ts** (line 205): reads `row.calories_burned_override` -- correct
- **useWeightEntries.ts** (line 42): reads `row.calories_burned_override` -- correct
- **useExportData.ts** (line 66): reads `row.calories_burned_override` -- correct
- **exercise-metadata.ts** (line 305): `KNOWN_METADATA_KEYS` uses key `'calories_burned'` -- this is the UI/virtual key, not a DB column name, so it stays as-is
- **chart-types.ts** (line 23): `ExerciseDayTotals.calories_burned` -- this is an aggregation field name, not a DB column, so it stays as-is
- **calorie-burn.test.ts**: tests use `exercise_metadata: { calories_burned: 320 }` to test the JSONB fallback path -- correct and valuable to keep

No other files need changes beyond the one-line fix in DetailDialog.

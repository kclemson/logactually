
# Fix: Strip promoted keys from exercise_metadata on write

## Problem
When logging an exercise, the promoted metadata values (e.g., `calories_burned`, `heart_rate`) are correctly written to their new dedicated columns (`calories_burned_override`, `heart_rate`), but the original `exercise_metadata` JSONB is also stored unchanged -- resulting in duplicate data.

## Root Cause
In `useWeightEntries.ts` line 93, `exercise_metadata: set.exercise_metadata ?? null` passes through the full JSONB object without removing keys that have been promoted to their own columns.

## Fix
In the `createEntry` mutation of `useWeightEntries.ts`, strip the 6 promoted keys (`calories_burned`, `effort`, `heart_rate`, `incline_pct`, `cadence_rpm`, `speed_mph`) from `exercise_metadata` before writing. If no keys remain, store `null` instead of an empty object.

## Technical Details

**File: `src/hooks/useWeightEntries.ts`**

Replace line 92-93:
```typescript
// Keep exercise_metadata for any non-promoted keys
exercise_metadata: set.exercise_metadata ?? null,
```

With logic that strips promoted keys:
```typescript
// Strip promoted keys from exercise_metadata, keep only unknown future keys
exercise_metadata: (() => {
  if (!set.exercise_metadata) return null;
  const promoted = ['calories_burned', 'effort', 'heart_rate', 'incline_pct', 'cadence_rpm', 'speed_mph'];
  const remaining = Object.fromEntries(
    Object.entries(set.exercise_metadata).filter(([k]) => !promoted.includes(k))
  );
  return Object.keys(remaining).length > 0 ? remaining : null;
})(),
```

This is a single-file, ~6-line change. No migration needed -- existing rows with duplicate data are harmless since the read path already prioritizes the column over the JSONB fallback.

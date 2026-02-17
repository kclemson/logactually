

# Fix Cardio Sets/Reps Bug + Hide Misleading Headers

## Problem

Two related bugs combine to confuse users logging only cardio:

1. **Data bug (edge function)**: The AI model inconsistently returns `sets: 1, reps: 1` for some cardio entries. The normalization logic doesn't zero them out because the condition `sets > 0 || reps > 0` preserves whatever the AI returns -- even for pure cardio exercises.

2. **Display bug (UI)**: Even when all exercises on a day are cardio, the "Sets / Reps / Lbs" column headers and totals still show, displaying misleading nonzero numbers.

## Fix

### 1. Edge function: Force sets/reps to 0 for cardio (`supabase/functions/analyze-weights/index.ts`)

After line 166 (after the existing default logic), add:

```typescript
// Force sets/reps to 0 for pure cardio (no weight)
const hasCardioData = duration_minutes > 0 || distance_miles > 0;
if (hasCardioData && weight_lbs === 0) {
  sets = 0;
  reps = 0;
}
```

This needs to go **before** the existing `hasCardioData` declaration at line 170 (or we move/reuse that declaration). Ensures that even if the AI returns `sets: 1, reps: 1` for a walk, they get zeroed.

### 2. Fix existing bad data

Run a one-time migration to clean up existing cardio rows that have nonzero sets/reps:

```sql
UPDATE weight_sets
SET sets = 0, reps = 0, updated_at = now()
WHERE weight_lbs = 0
  AND (duration_minutes IS NOT NULL AND duration_minutes > 0
       OR distance_miles IS NOT NULL AND distance_miles > 0)
  AND (sets > 0 OR reps > 0);
```

### 3. UI: Hide headers/totals on all-cardio days (`src/components/WeightItemsTable.tsx`)

Add an `allCardio` useMemo. When true, replace the "Sets", "Reps", weight-unit labels and their totals with empty spans (preserving the grid structure).

- **After the `totals` useMemo (~line 166)**: Add `allCardio` computed value
- **TotalsRow (~lines 213-220)**: Conditionally hide the three numeric columns
- **Header row (~lines 249-251)**: Conditionally hide labels
- **Mini header row (~lines 261-263)**: Same

Mixed days (cardio + strength together) continue to show all columns unchanged.


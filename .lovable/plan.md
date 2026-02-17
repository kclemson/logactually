

# Run Data Cleanup + UI Fix

## 1. Database data cleanup (211 rows)

Use the database insert tool to execute:

```sql
UPDATE weight_sets
SET sets = 0, reps = 0, updated_at = now()
WHERE weight_lbs = 0
  AND (duration_minutes IS NOT NULL AND duration_minutes > 0
       OR distance_miles IS NOT NULL AND distance_miles > 0)
  AND (sets > 0 OR reps > 0);
```

## 2. UI: Hide headers/totals on all-cardio days

In `src/components/WeightItemsTable.tsx`:

- Add `allCardio` useMemo after the existing `totals` memo
- When all items are cardio (weight_lbs === 0 with duration or distance), hide "Sets", "Reps", and weight-unit column headers and totals
- Mixed days remain unchanged


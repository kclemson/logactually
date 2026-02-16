
# Update `get_top_exercises` RPC to exclude exercises with explicit calorie metadata

## Problem
The calorie burn preview dialog shows exercises that have a precise `calories_burned` value (e.g., from an Apple Watch), which display as a single number instead of a range -- defeating the purpose of demonstrating range estimation.

## Solution
Update the `get_top_exercises` database function to exclude rows where `exercise_metadata->>'calories_burned'` is set. Since `CalorieBurnDialog.tsx` is the only caller, this is the cleanest approach -- no client-side filtering needed.

## Technical Details

### Database migration (single SQL statement)

Modify both `LATERAL` subqueries in the function to add a filter:

```sql
WHERE ...existing conditions...
  AND (exercise_metadata IS NULL OR exercise_metadata->>'calories_burned' IS NULL)
```

This applies to both the cardio and strength branches of the function. The frequency counts (used for ranking) and the lateral join (used for picking the most recent example) both need the filter so that:
1. Exercises that always have explicit calories don't appear in the ranking
2. The picked example row doesn't have explicit calories

The full function signature and return type remain unchanged. No code changes needed in `CalorieBurnDialog.tsx`.

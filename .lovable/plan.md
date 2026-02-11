

## Fix: Group exercises by subtype in `get_top_exercises` RPC

### Problem
The RPC groups cardio exercises by `exercise_key` only. This means `walk_run/walking` (210 entries) and `walk_run/running` (43 entries) get merged into a single "walk_run" bucket. The LATERAL join then picks the most recent row, which happened to be a walking entry. Running (your 2nd most common cardio) never gets its own preview slot.

### Solution
Update the `get_top_exercises` SQL function to group by `(exercise_key, COALESCE(exercise_subtype, ''))` in both the cardio and strength subqueries. The LATERAL join filter also needs to match on subtype.

### Database Migration

Replace the two inner subqueries and LATERAL joins to group and filter by both `exercise_key` and `exercise_subtype`:

```sql
-- Cardio half (strength half mirrors this change)
SELECT exercise_key, exercise_subtype, COUNT(*) as cnt
FROM weight_sets WHERE user_id = p_user_id
  AND exercise_key = ANY(p_cardio_keys)
GROUP BY exercise_key, exercise_subtype  -- was just exercise_key
ORDER BY cnt DESC
LIMIT p_limit_per_group

-- LATERAL join also matches subtype
WHERE user_id = p_user_id
  AND exercise_key = sub.exercise_key
  AND (exercise_subtype IS NOT DISTINCT FROM sub.exercise_subtype)  -- added
ORDER BY created_at DESC LIMIT 1
```

This way `walk_run/walking` and `walk_run/running` compete independently, and your top 2 cardio would correctly be "Treadmill Walk" and "Running".

### Files Changed
- One new SQL migration (replaces the `get_top_exercises` function)
- No frontend changes needed -- the RPC return shape is unchanged


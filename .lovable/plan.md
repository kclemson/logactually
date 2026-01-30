

## Change "Users w/Logged Items" to Daily Active Users

### Goal
Update the daily stats table to show users who logged items (food **or** weight) on that specific day, instead of cumulative users who have ever logged items.

### Current Behavior
The `users_with_entries` field counts users who have logged food entries **up to and including** that date (cumulative).

### New Behavior  
Count distinct users who logged **either** food entries **or** weight entries **on that specific day**.

### Changes Required

**Database Migration** - Update `get_usage_stats` function

The daily_stats subquery currently has:
```sql
(SELECT COUNT(DISTINCT fe.user_id) FROM food_entries fe
 JOIN profiles p ON fe.user_id = p.id
 WHERE fe.eaten_date <= d.stat_date  -- cumulative
   AND (...)) as users_with_entries,
```

Change to:
```sql
(SELECT COUNT(DISTINCT user_id) FROM (
  SELECT fe.user_id FROM food_entries fe
  JOIN profiles p ON fe.user_id = p.id
  WHERE fe.eaten_date = d.stat_date  -- same day only
    AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
  UNION
  SELECT ws.user_id FROM weight_sets ws
  JOIN profiles p ON ws.user_id = p.id
  WHERE ws.logged_date = d.stat_date  -- same day only
    AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
) active_users) as users_with_entries,
```

**Frontend** - Update column header in `src/pages/Admin.tsx`

Line 144: Change header text from "Users w/Logged Items" to "Active Users" (shorter, clearer meaning now that it's daily).

### Summary
- 1 database function update (SQL migration)
- 1 small frontend text change
- No TypeScript interface changes needed (same field name)


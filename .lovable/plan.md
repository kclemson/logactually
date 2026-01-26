

## Sort Admin User Table by User Number (Ascending)

### Overview
Change the user stats table sorting so User 1 appears at the top and User 6 (the newest/test user) appears at the bottom.

---

### Change Required

**Database Function: `get_user_stats`**

Update the ORDER BY clause:

| Before | After |
|--------|-------|
| `ORDER BY t.total_entries DESC` | `ORDER BY t.user_number ASC` |

---

### SQL Migration

```sql
CREATE OR REPLACE FUNCTION public.get_user_stats(
  user_timezone text DEFAULT 'America/Los_Angeles'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_today date;
BEGIN
  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.user_number ASC)  -- Changed from total_entries DESC
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    GROUP BY p.id, p.user_number
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;
```

---

### Result

| Before | After |
|--------|-------|
| User 6 (106 entries) | User 1 |
| User 1 (27 entries) | User 2 |
| User 3 (15 entries) | User 3 |
| User 4 (3 entries) | User 4 |
| User 2 (1 entry) | User 5 |
| User 5 (1 entry) | User 6 (test user) |

The table will now show users in chronological signup order, with the oldest account (User 1) at the top.




## Add user activity timeline to admin portal

When you tap/click a user row in the admin stats table, it expands to show a compact timeline of their distinct activity dates (days they logged food or exercise entries). This reveals patterns like gaps, streaks, and re-engagement without needing a separate page.

### Approach

**1. New database function** `get_user_activity_dates(target_user_id uuid)`
- Admin-gated via `has_role` check
- Returns distinct dates (union of `food_entries.eaten_date` and `weight_sets.logged_date`) for the given user, ordered descending
- Limit to last 90 days to keep it focused

**2. New hook** `src/hooks/useUserActivityDates.ts`
- Calls the RPC with a user_id, enabled only when a row is expanded
- Returns array of date strings

**3. UI change in `src/pages/Admin.tsx`**
- Track an `expandedUserId` state (single user at a time)
- Clicking a user row toggles expansion
- Expanded row shows a second `<tr>` spanning all columns with a compact date list — grouped by month, showing just the day numbers (e.g. "Feb: 28, 25, 20, 18 · Jan: 31, 28, 15, 3")
- Keeps the existing table layout intact; the detail row sits underneath

### Technical details

```sql
CREATE OR REPLACE FUNCTION public.get_user_activity_dates(target_user_id uuid)
RETURNS TABLE(activity_date date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
    SELECT DISTINCT d FROM (
      SELECT eaten_date AS d FROM food_entries WHERE user_id = target_user_id
      UNION
      SELECT logged_date AS d FROM weight_sets WHERE user_id = target_user_id
    ) combined
    WHERE d >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY d DESC;
END;
$$;
```

The hook queries on-demand when a user row is clicked. The UI renders a compact month-grouped string so you can quickly spot gaps and clusters.




## Add 'Last Active' Column to User Stats Table

### Goal

Add a column showing when each user last logged a food entry, displayed as a relative or formatted date.

### Changes Required

| Location | Change |
|----------|--------|
| Database function `get_user_stats` | Add `last_active` field with MAX(created_at) from food_entries |
| `src/hooks/useAdminStats.ts` | Add `last_active` to UserStats interface |
| `src/pages/Admin.tsx` | Add column header and cell displaying the last active date |

### Technical Details

**1. Database Migration - Update `get_user_stats` function:**

```sql
CREATE OR REPLACE FUNCTION public.get_user_stats(user_timezone text DEFAULT 'America/Los_Angeles'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_today date;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.user_number ASC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today,
      MAX(fe.created_at) as last_active
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    GROUP BY p.id, p.user_number
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;
```

**2. Update TypeScript Interface (`src/hooks/useAdminStats.ts`):**

```typescript
interface UserStats {
  user_id: string;
  user_number: number;
  total_entries: number;
  entries_today: number;
  last_active: string | null;  // Add this field
}
```

**3. Update Admin Table (`src/pages/Admin.tsx`):**

Add table header:
```tsx
<th className="text-center py-0.5 font-medium text-muted-foreground">Last Active</th>
```

Add table cell with formatted date:
```tsx
<td className="text-center py-0.5">
  {user.last_active 
    ? format(parseISO(user.last_active), "MMM d")
    : "—"}
</td>
```

### Result

The user stats table will display:

| User | Total Entries | Today | Last Active |
|------|---------------|-------|-------------|
| User 1 (KC) | 38 | 6 | Jan 27 |
| User 2 (Jared) | 1 | 0 | Jan 22 |
| ... | ... | ... | ... |

Users who have never logged an entry will show "—" in the Last Active column.


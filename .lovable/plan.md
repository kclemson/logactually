

## Remove login_count Column from Profiles

### Overview

Clean up the now-redundant `login_count` column from the `profiles` table since all login tracking now uses the `login_events` table.

---

### Database Migration

#### 1. Update `increment_login_count` Function

Remove the `UPDATE profiles` statement - keep only the `INSERT INTO login_events`:

```sql
CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  INSERT INTO login_events (user_id)
  VALUES (user_id);
$$;
```

#### 2. Update `get_usage_stats` Function

Replace the `demo_logins` calculation to use `login_events`:

```sql
'demo_logins', (
  SELECT COUNT(*) 
  FROM login_events le
  JOIN profiles p ON le.user_id = p.id
  WHERE p.is_read_only = true
)
```

#### 3. Drop the Column

```sql
ALTER TABLE profiles DROP COLUMN login_count;
```

---

### No Code Changes Required

- `useAuth.tsx` and `Auth.tsx` call `increment_login_count` RPC which will continue to work
- `useAdminStats.ts` uses `login_count` from `get_user_stats` which already queries `login_events`
- TypeScript types will auto-regenerate after migration

---

### Data Note

The historical `login_count` values in `profiles` will be lost. Going forward, all login metrics come from `login_events` which only has data from when it was created.

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Update functions and drop column |


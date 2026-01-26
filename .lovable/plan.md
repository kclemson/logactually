

## Add Permanent User Number to Database Schema

### Overview
Add a permanent, auto-incrementing `user_number` column to the `profiles` table. This number is assigned once at signup and never changes, ensuring efficient queries at scale.

---

### Database Migration

**1. Add column to profiles table**

```sql
ALTER TABLE public.profiles 
ADD COLUMN user_number INTEGER;
```

**2. Backfill existing users based on signup order**

```sql
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as num
  FROM public.profiles
)
UPDATE public.profiles p
SET user_number = n.num
FROM numbered n
WHERE p.id = n.id;
```

**3. Update the `handle_new_user` trigger to assign next number**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(user_number), 0) + 1 INTO next_number FROM public.profiles;
  
  INSERT INTO public.profiles (id, user_number)
  VALUES (NEW.id, next_number);
  
  RETURN NEW;
END;
$function$;
```

**4. Add NOT NULL constraint after backfill**

```sql
ALTER TABLE public.profiles 
ALTER COLUMN user_number SET NOT NULL;
```

**5. Add unique index for fast lookups**

```sql
CREATE UNIQUE INDEX idx_profiles_user_number ON public.profiles(user_number);
```

---

### Code Changes

**File: `src/integrations/supabase/types.ts`**

The types will auto-update after migration. The profiles table will include:
```typescript
user_number: number
```

**File: `supabase/functions/seed-test-user/index.ts`**

No changes needed - the trigger handles user_number assignment automatically.

**File: Database function `get_user_stats`**

Update to return the stored `user_number` instead of calculating it:

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
  
  SELECT json_agg(row_to_json(t) ORDER BY t.total_entries DESC)
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

**File: `src/hooks/useAdminStats.ts`**

Update interface:
```typescript
interface UserStats {
  user_id: string;
  user_number: number;
  total_entries: number;
  entries_today: number;
}
```

**File: `src/pages/Admin.tsx`**

Use the stored number:
```tsx
<td className="py-0.5 pr-2">User {user.user_number}</td>
```

---

### How It Works

```text
User signs up
    ↓
auth.users INSERT triggers handle_new_user()
    ↓
Trigger calculates MAX(user_number) + 1
    ↓
INSERT into profiles with permanent user_number
    ↓
Number never changes, even if other users are deleted
```

---

### Result

| Aspect | Before | After |
|--------|--------|-------|
| Calculation | ROW_NUMBER() at query time | Stored on signup |
| Performance | O(n log n) per query | O(1) indexed lookup |
| Permanence | Could shift if users deleted | Never changes |
| Gaps | Close on deletion | Remain permanently |

---

### Example Data After Migration

| user_number | created_at | Status |
|-------------|------------|--------|
| 1 | Jan 1 | First signup |
| 2 | Jan 5 | Second signup |
| 3 | Jan 10 | (deleted) - gap remains |
| 4 | Jan 15 | Fourth signup |
| 5 | Jan 20 | Fifth signup |
| 6 | Jan 25 | Test user (most recent) |


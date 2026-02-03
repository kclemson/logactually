

## Parameterized Login Count Query

### Overview

Instead of hardcoding specific time windows in `get_usage_stats`, create a flexible RPC function that accepts user filter and timeframe parameters.

---

### Database Design

#### New RPC Function: `get_login_count`

```sql
CREATE OR REPLACE FUNCTION public.get_login_count(
  user_filter TEXT DEFAULT 'all',        -- 'demo', 'all', or a specific user_id
  timeframe_hours INT DEFAULT NULL       -- NULL = all time, 24 = last day, 168 = last 7 days
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result INT;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COUNT(*)::INT INTO result
  FROM login_events le
  JOIN profiles p ON le.user_id = p.id
  WHERE 
    -- User filter
    CASE 
      WHEN user_filter = 'demo' THEN p.is_read_only = true
      WHEN user_filter = 'all' THEN true
      ELSE le.user_id = user_filter::uuid
    END
    -- Timeframe filter
    AND (timeframe_hours IS NULL OR le.created_at > NOW() - (timeframe_hours || ' hours')::interval);

  RETURN result;
END;
$$;
```

#### Usage Examples

```sql
-- Demo logins in last 24 hours
SELECT get_login_count('demo', 24);

-- Demo logins in last 7 days
SELECT get_login_count('demo', 168);

-- All logins in last 30 days
SELECT get_login_count('all', 720);

-- All-time demo logins
SELECT get_login_count('demo', NULL);

-- Specific user's logins in last week
SELECT get_login_count('user-uuid-here', 168);
```

---

### Simplified `get_usage_stats`

Remove the hardcoded demo login time windows from `get_usage_stats`. Keep only `demo_logins` (all-time count from `login_count` on profile) for backward compatibility, or remove it entirely since it can now be queried via `get_login_count('demo', NULL)`.

---

### TypeScript Changes

#### New Hook: `useLoginCount`

**File: `src/hooks/useLoginCount.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type UserFilter = 'demo' | 'all' | string; // string for specific user_id

export function useLoginCount(userFilter: UserFilter, timeframeHours: number | null) {
  return useQuery({
    queryKey: ['login-count', userFilter, timeframeHours],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_login_count', {
        user_filter: userFilter,
        timeframe_hours: timeframeHours
      });
      if (error) throw error;
      return data ?? 0;
    },
  });
}
```

---

### UI Changes

**File: `src/pages/Admin.tsx`**

Use the new hook to fetch demo login counts with different timeframes:

```tsx
const { data: demoLoginsTotal } = useLoginCount('demo', null);
const { data: demoLogins24h } = useLoginCount('demo', 24);
const { data: demoLogins7d } = useLoginCount('demo', 168);

// In JSX
<div className="space-y-0">
  <p>Demo logins: {demoLoginsTotal ?? 0}</p>
  <p>Demo 24h: {demoLogins24h ?? 0}</p>
  <p>Demo 7d: {demoLogins7d ?? 0}</p>
</div>
```

---

### Benefits

1. **Flexibility**: Query any user type with any timeframe
2. **Future-proof**: Easy to add "All users 24h" or "Specific user 7d" without DB changes
3. **Clean separation**: Login count logic isolated in its own function
4. **Cacheable**: React Query caches each parameter combination separately

---

### Database Migration Summary

1. Create `login_events` table with indexes and RLS
2. Update `increment_login_count` to insert login events
3. Create new `get_login_count` parameterized function
4. Optionally remove demo login fields from `get_usage_stats`

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Create `login_events` table, update `increment_login_count`, create `get_login_count` |
| `src/hooks/useLoginCount.ts` | New hook for parameterized login count queries |
| `src/hooks/useAdminStats.ts` | Remove demo login fields from interface (optional) |
| `src/pages/Admin.tsx` | Remove `font-medium`, use new `useLoginCount` hook |


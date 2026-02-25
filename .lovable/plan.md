

# Fix: `demoBeta` query checks wrong user

## Problem
The `demoBeta` query (line 143-155) checks `user_roles` for *any* user with `role = 'beta'`, not specifically the demo account. If the admin also has beta, it always returns true.

## Solution
1. Create an `is_demo_beta()` RPC (SECURITY DEFINER, admin-only) that looks up the demo user by email and checks their beta role specifically.
2. Replace the client-side query with a call to this RPC.

## Changes

### 1. New database migration: `is_demo_beta()` function

```sql
CREATE OR REPLACE FUNCTION public.is_demo_beta()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  demo_uid uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.id INTO demo_uid
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = demo_uid AND role = 'beta'
  );
END;
$$;
```

### 2. `src/pages/Admin.tsx` (lines 143-155)
Replace the `demoBeta` query:

```typescript
const { data: demoBeta } = useQuery({
  queryKey: ['demoBeta'],
  queryFn: async () => {
    const { data, error } = await supabase.rpc('is_demo_beta' as any);
    if (error) return false;
    return data === true;
  },
  staleTime: 60_000,
});
```

| File | Change |
|---|---|
| New migration | Add `is_demo_beta()` RPC |
| `src/pages/Admin.tsx` | Replace client-side `user_roles` query with `is_demo_beta()` RPC call |


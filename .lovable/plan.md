

## Toggle Demo Account Read-Only from Admin Page

### What changes

A small toggle button appears near the existing "Demo logins" stats on the Admin page. It shows the current lock state and lets you flip it with one click.

```text
Demo logins: 42        🔒 Locked  [Unlock]
```

After clicking "Unlock", the demo account becomes writable and the button updates to:

```text
Demo logins: 42        🔓 Unlocked  [Lock]
```

### Security approach

A new database function `toggle_demo_read_only` runs as `SECURITY DEFINER` and:
1. Checks the caller has the `admin` role (raises exception otherwise)
2. Toggles `profiles.is_read_only` for the single profile where `is_read_only = true` (the demo account)
3. Returns the new boolean value

This keeps the operation server-side with no client-side privilege escalation possible.

### Technical Details

#### 1. New database function (migration)

```sql
CREATE OR REPLACE FUNCTION public.toggle_demo_read_only()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_val boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE profiles
  SET is_read_only = NOT is_read_only
  WHERE id = (
    SELECT p.id FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = 'demo@logactually.com'
    LIMIT 1
  )
  RETURNING is_read_only INTO new_val;

  RETURN new_val;
END;
$$;
```

#### 2. Update `src/pages/Admin.tsx`

- Add state for `demoLocked` (initialized from the profile query or a small dedicated query)
- Add a button next to the demo logins stats that calls `supabase.rpc('toggle_demo_read_only')` and updates local state with the returned value
- Show a lock/unlock icon and label to indicate current state
- Query initial state via `supabase.from('profiles').select('is_read_only').eq('is_read_only', true).limit(1)` -- or simpler, add a small RPC that returns the current value

To keep it minimal, the toggle RPC already returns the new value, so we just need the initial state. We can fetch it with a simple query inside a `useQuery` since admins can view all profiles.

#### 3. Files to modify

- **Database migration**: new `toggle_demo_read_only()` function
- **`src/pages/Admin.tsx`**: add lock/unlock button in the demo logins stats column


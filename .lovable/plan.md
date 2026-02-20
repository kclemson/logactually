

# Add Beta Role Toggle for Demo User in Admin Panel

## What this does
Adds a small toggle button next to the demo lock button in the admin panel, letting you grant or revoke the `beta` role for the demo account with one click -- identical UX to the existing lock/unlock toggle.

## Steps

### 1. Database migration
- Add `'beta'` to the `app_role` enum
- Create a `toggle_demo_beta()` SECURITY DEFINER function that:
  - Checks admin role (same pattern as `toggle_demo_read_only`)
  - Looks up the demo user by email
  - If the user has the `beta` role, deletes it; otherwise inserts it
  - Returns the new boolean state

### 2. Admin page UI (`src/pages/Admin.tsx`)
- Add a React Query fetch for the demo user's beta status (check `user_roles` for demo user + beta role)
- Add state + handler for toggling (mirrors `handleToggleDemoLock`)
- Render a small inline button next to the existing lock toggle, showing "Beta" with a colored indicator (green when enabled, muted when not)

### Technical details

**New DB function:**
```sql
CREATE OR REPLACE FUNCTION public.toggle_demo_beta()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  demo_uid uuid;
  currently_beta boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.id INTO demo_uid
  FROM profiles p JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = demo_uid AND role = 'beta'
  ) INTO currently_beta;

  IF currently_beta THEN
    DELETE FROM user_roles WHERE user_id = demo_uid AND role = 'beta';
  ELSE
    INSERT INTO user_roles (user_id, role) VALUES (demo_uid, 'beta');
  END IF;

  RETURN NOT currently_beta;
END;
$$;
```

**UI addition** (next to lock button on line ~191):
- A small button styled like the lock toggle: `"Beta"` label, green text when active, muted when inactive
- Query key: `['demoBeta']`
- Toggle handler calls `supabase.rpc('toggle_demo_beta')`
- Cache update on success, same pattern as `demoReadOnly`


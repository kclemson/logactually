

## Harden Admin Access: Remove Dev Mode Bypasses and Add Server-Side Role Checks

### Overview

This plan removes all `import.meta.env.DEV` bypasses for admin functionality and adds server-side role validation to the database functions. After this change, admin access will be controlled exclusively by RBAC via the `user_roles` table.

**Non-admin user experience is completely unaffected** - the admin nav link remains hidden throughout (no layout shift), and DevToolsPanel is absolutely positioned.

### Changes Summary

| Component | Current Behavior | After Change |
|-----------|------------------|--------------|
| `get_usage_stats` | No role check | Throws exception if caller is not admin |
| `get_user_stats` | No role check | Throws exception if caller is not admin |
| `Admin.tsx` | DEV mode or admin role | Admin role only; renders `null` while checking |
| `BottomNav.tsx` | DEV mode or admin role | Admin role only |
| `Layout.tsx` | DevToolsPanel in DEV only | DevToolsPanel for admin users only |

### Implementation Details

#### 1. Database Migration

Add role validation to both admin RPC functions:

```sql
-- Recreate get_usage_stats with admin check
CREATE OR REPLACE FUNCTION public.get_usage_stats(user_timezone text DEFAULT 'America/Los_Angeles')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  local_now timestamp;
  local_today date;
BEGIN
  -- Admin role check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- ... rest of existing function body
END;
$$;

-- Recreate get_user_stats with admin check
CREATE OR REPLACE FUNCTION public.get_user_stats(user_timezone text DEFAULT 'America/Los_Angeles')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
  local_today date;
BEGIN
  -- Admin role check
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- ... rest of existing function body
END;
$$;
```

#### 2. `src/pages/Admin.tsx`

Remove DEV bypass and spinner:

```tsx
// BEFORE (lines 12-22):
const hasAccess = import.meta.env.DEV || isAdmin;

if (!import.meta.env.DEV && isAdminLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-6 w-6 animate-spin ..." />
    </div>
  );
}

if (!hasAccess) {
  return <Navigate to="/" replace />;
}

// AFTER:
if (isAdminLoading) {
  return null;
}

if (!isAdmin) {
  return <Navigate to="/" replace />;
}
```

#### 3. `src/components/BottomNav.tsx`

Remove DEV bypass:

```tsx
// BEFORE (line 10):
const showAdmin = import.meta.env.DEV || isAdmin;

// AFTER:
const showAdmin = isAdmin;
```

#### 4. `src/components/Layout.tsx`

Replace DEV check with admin role check:

```tsx
// BEFORE:
{import.meta.env.DEV && <DevToolsPanel />}

// AFTER:
import { useIsAdmin } from '@/hooks/useIsAdmin';

export function Layout() {
  const { data: isAdmin } = useIsAdmin();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-lg px-3 pb-20 pt-4 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
      {isAdmin && <DevToolsPanel />}
    </div>
  );
}
```

### Files to Change

| File | Change |
|------|--------|
| Database migration | Add `has_role(auth.uid(), 'admin')` check to both functions |
| `src/pages/Admin.tsx` | Remove DEV bypass, replace spinner with `return null` |
| `src/components/BottomNav.tsx` | Remove DEV bypass |
| `src/components/Layout.tsx` | Replace DEV check with `useIsAdmin` hook |

### Security Finding Resolution

After implementation, the `admin_stats_no_role_check` finding will be deleted as it will be fully resolved.


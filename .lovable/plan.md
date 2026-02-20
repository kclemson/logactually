
# Scope correction: gate My Charts on `canUseCharts = isAdmin || isBeta`

## What was wrong in the previous plan description

The plan text said "The food/exercise AI Ask buttons and other features that are admin-only remain untouched." That was inaccurate — the Ask AI buttons are NOT admin-gated at all; they're available to everyone. This doesn't change what needs to happen, it just means there's no risk of accidentally touching those buttons. The two `isAdmin` guards in `Trends.tsx` are exclusively around the My Charts feature (the `+ Chart` button and the My Charts collapsible section).

## Confirmed scope: exactly two `isAdmin` references in `Trends.tsx` relate to My Charts

| Line | Current | After |
|---|---|---|
| 346 | `{isAdmin && <Button … + Chart>}` | `{canUseCharts && <Button … + Chart>}` |
| 359 | `{isAdmin && savedCharts.length > 0 && (` | `{canUseCharts && savedCharts.length > 0 && (` |

Everything else (`isAdmin` used for DevTools panel, admin page navigation, etc.) is untouched.

## Full change set

### 1. Database migration — add `beta` to the `app_role` enum

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta';
```

Non-destructive. The existing `has_role()` security definer function and `user_roles` RLS policies already cover this new value — no policy changes needed.

### 2. New hook: `src/hooks/useIsBeta.ts`

```ts
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export function useIsBeta() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['isBeta', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'beta' });
      if (error) return false;
      return data === true;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
```

Exact mirror of `useIsAdmin.ts` — same pattern, same staleTime.

### 3. `src/pages/Trends.tsx` — two-line change

Add `useIsBeta` import, derive `canUseCharts`, replace the two occurrences:

```ts
import { useIsBeta } from "@/hooks/useIsBeta";

// Near top of component:
const { data: isAdmin } = useIsAdmin();
const { data: isBeta } = useIsBeta();
const canUseCharts = isAdmin || isBeta;
```

Then lines 346 and 359 change `isAdmin` → `canUseCharts`. That's all.

### 4. `src/pages/Admin.tsx` — Beta Users management section

A new collapsible section (consistent with existing admin UI patterns) with:
- A list of current beta users pulled from `user_roles` where `role = 'beta'`, joined with user number from existing stats data
- A user picker (select from existing users) to grant the beta role
- A revoke button next to each beta user

Two mutations (both protected by existing `"Admins can manage roles"` RLS policy which covers all operations on `user_roles`):
- **Grant**: `INSERT INTO user_roles (user_id, role) VALUES (uuid, 'beta') ON CONFLICT DO NOTHING`
- **Revoke**: `DELETE FROM user_roles WHERE user_id = uuid AND role = 'beta'`

The admin page already queries all user stats including `user_id`, so the select dropdown can map user IDs to user numbers without any additional queries.

## What beta users see vs. don't see

| Feature | Admin | Beta | Regular |
|---|---|---|---|
| My Charts (+ Chart button, saved charts grid) | Yes | Yes | No |
| Ask AI (food/exercise) | Yes | Yes | Yes (already public) |
| Admin page | Yes | No | No |
| DevTools panel | Yes | No | No |



# Wire Charts Access to the Beta Role

## What this does
Creates a `useIsBeta` hook and updates the Trends page so users with either the `admin` or `beta` role can access the custom charts feature ("+ Charts" button, My Charts section).

## Steps

### 1. Create `src/hooks/useIsBeta.ts`
- Mirror the existing `useIsAdmin` hook exactly
- Call `has_role(user.id, 'beta')` via RPC
- Return a React Query result with 5-minute stale time

### 2. Update `src/pages/Trends.tsx`
- Import `useIsBeta`
- Derive `canUseCharts = isAdmin || isBeta`
- Replace every `isAdmin` guard on chart features with `canUseCharts`:
  - The "+ Charts" button (line ~346)
  - The "My Charts" collapsible section (line ~359)
  - Any chart edit/delete controls gated by `isAdmin`

No database changes needed -- the `beta` enum value and `has_role` function already exist.

## Technical details

**New hook (`src/hooks/useIsBeta.ts`):**
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

**Trends.tsx changes:**
- Add `const { data: isBeta } = useIsBeta();`
- Add `const canUseCharts = isAdmin || isBeta;`
- Replace `isAdmin &&` with `canUseCharts &&` in the two chart-related guards


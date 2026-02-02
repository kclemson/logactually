

## Fix Settings Sync with React Query

### Overview
Refactor `useUserSettings` to use React Query for shared state management, ensuring settings changes propagate instantly across all components (Settings, BottomNav, Trends, History).

---

### Changes

| File | Change |
|------|--------|
| `src/hooks/useUserSettings.ts` | Replace `useState` with `useQuery`/`useMutation` |

---

### Implementation

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { WeightUnit } from '@/lib/weight-units';

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  weightUnit: WeightUnit;
  showWeights: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  weightUnit: 'lbs',
  showWeights: true,
};

export function useUserSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_SETTINGS;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch settings:', error);
        return DEFAULT_SETTINGS;
      }
      
      return { ...DEFAULT_SETTINGS, ...(data?.settings as Partial<UserSettings>) };
    },
    enabled: !!user,
    staleTime: Infinity, // Settings rarely change, don't refetch automatically
  });

  const { mutate: updateSettings } = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('No user');
      
      const newSettings = { ...settings, ...updates };
      
      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id);

      if (error) throw error;
      return newSettings;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings', user?.id] });
      const previous = queryClient.getQueryData<UserSettings>(['user-settings', user?.id]);
      
      queryClient.setQueryData(['user-settings', user?.id], (old: UserSettings = DEFAULT_SETTINGS) => ({
        ...old,
        ...updates,
      }));
      
      return { previous };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(['user-settings', user?.id], context?.previous);
      console.error('Failed to save settings:', err);
    },
  });

  return { settings, updateSettings, isLoading };
}
```

---

### How It Works

1. **Shared Cache**: All components read from same React Query cache key `['user-settings', userId]`
2. **Optimistic Update**: `onMutate` updates cache immediately before API call
3. **Instant Propagation**: When Settings toggles `showWeights`, BottomNav re-renders instantly
4. **Rollback on Error**: If save fails, previous value is restored

---

### No Other Changes Needed

- BottomNav, Trends, History already call `useUserSettings()` correctly
- They'll automatically receive updated values from the shared cache
- No changes to consuming components required


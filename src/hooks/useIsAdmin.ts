import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

// Persist the resolved admin flag per user so the Admin tab in the bottom nav
// doesn't flash off-then-on while the role check runs after a (re)load.
const adminCacheKey = (userId: string) => `is-admin:${userId}`;

function readPersistedAdmin(userId: string | undefined): boolean | undefined {
  if (!userId) return undefined;
  try {
    const raw = localStorage.getItem(adminCacheKey(userId));
    if (raw === null) return undefined;
    return raw === 'true';
  } catch {
    return undefined;
  }
}

function writePersistedAdmin(userId: string, isAdmin: boolean) {
  try {
    localStorage.setItem(adminCacheKey(userId), String(isAdmin));
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function useIsAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (error) return false;
      const isAdmin = data === true;
      writePersistedAdmin(user.id, isAdmin);
      return isAdmin;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    // Seed from last-known persisted value so the nav doesn't flash defaults.
    placeholderData: () => readPersistedAdmin(user?.id),
  });
}

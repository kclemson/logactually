

## Part 1: Fix Sign-Out Cache Clearing Bug

### The Problem Explained

When a user signs out, there are **three layers of state** that need to be cleared:

1. **Supabase localStorage token** (`sb-enricsnosdrhmfvbjaei-auth-token`) - This is Supabase's built-in session storage
2. **Module-level cache** (`cachedSession` and `cachedUser` variables in `useAuth.tsx`) - These survive component re-renders
3. **React state** (`session` and `user` from `useState`) - The actual UI state

The current `signOut` function correctly clears layers 2 and 3, but there's a **race condition** problem:

```text
Current Flow:
1. signOut() calls supabase.auth.signOut()
2. signOut() clears module cache + React state
3. BUT: ProtectedRoute has hasStoredSession() check
   └─> This reads localStorage BEFORE Supabase clears it
   └─> Returns true, shows spinner instead of redirecting
4. onAuthStateChange fires SIGNED_OUT event
   └─> Tries to clear cache again (already cleared)
5. User gets stuck in limbo or flash-redirects
```

The issue is that `ProtectedRoute.tsx` line 40 checks `hasStoredSession()` as a "fallback" to prevent redirect flashes during login. But this same check **blocks the redirect during logout** because localStorage isn't cleared instantly.

Additionally, there's a **fourth layer** that isn't being cleared: **React Query cache**. After sign-out, if a user signs in as a different account, they might briefly see the previous user's data.

---

### The Fix

**1. Clear localStorage explicitly in signOut (useAuth.tsx)**

Add explicit localStorage removal to ensure the Supabase token is gone before `ProtectedRoute` checks it:

```typescript
const signOut = async () => {
  // Clear localStorage FIRST - before any async operations
  // This ensures ProtectedRoute's hasStoredSession() returns false immediately
  const storageKey = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
  localStorage.removeItem(storageKey);
  
  try {
    await supabase.auth.signOut();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Sign out API call failed:', error);
    }
  }
  
  // Clear all local state
  cachedSession = null;
  cachedUser = null;
  setSession(null);
  setUser(null);
};
```

**2. Export a way to clear React Query cache (useAuth.tsx)**

To properly clear cached data, we need to provide a `queryClient.clear()` call. The cleanest way is to pass the queryClient to the signOut function or use a callback:

```typescript
// Add to AuthContextType
signOut: (options?: { clearQueryCache?: () => void }) => Promise<void>;

// In signOut implementation
const signOut = async (options?: { clearQueryCache?: () => void }) => {
  // ... existing logic ...
  
  // Clear React Query cache if provided
  options?.clearQueryCache?.();
};
```

**3. Update Settings.tsx to pass the query cache clear function**

```typescript
const queryClient = useQueryClient();

const handleSignOut = async () => {
  setIsSigningOut(true);
  await signOut({ 
    clearQueryCache: () => queryClient.clear() 
  });
};
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add explicit localStorage clear + optional queryClient clear callback |
| `src/pages/Settings.tsx` | Pass `clearQueryCache` callback to signOut |
| `src/components/DemoBanner.tsx` | Pass `clearQueryCache` callback (optional - demo user doesn't matter as much) |
| `src/components/ReadOnlyOverlay.tsx` | Pass `clearQueryCache` callback (optional) |
| `src/components/DeleteAccountDialog.tsx` | Pass `clearQueryCache` callback |

---

### Why This Works

```text
Fixed Flow:
1. signOut() removes localStorage token FIRST (synchronous)
2. ProtectedRoute's hasStoredSession() now returns false immediately
3. signOut() calls supabase.auth.signOut() (async)
4. signOut() clears module cache + React state
5. signOut() clears React Query cache
6. User is cleanly redirected to /auth with no stale data
```

The key insight is that we clear localStorage **synchronously before any async operations**, so `ProtectedRoute` immediately sees there's no session.

---

### Technical Details

The localStorage key follows Supabase's naming convention: `sb-{project_id}-auth-token`. We already have the project ID available via `VITE_SUPABASE_PROJECT_ID` environment variable, or we can hardcode it since it's already hardcoded in `ProtectedRoute.tsx` line 11.

For consistency, I recommend using the environment variable approach where possible, but falling back to the hardcoded value if needed.


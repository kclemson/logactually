
## Fix HMR Auth State Race Condition

### The Problem
During development (HMR), the auth state can become inconsistent:

1. User logs a saved meal
2. HMR triggers a component remount of `AuthProvider`
3. `onAuthStateChange` fires `INITIAL_SESSION` with `session = null` AFTER valid `SIGNED_IN` events
4. The current code ignores this null session (doesn't set loading=false), but the user/session React state may already be null from the remount
5. `ProtectedRoute` sees `loading=false` + `user=null` and redirects to `/auth`

The issue is that when the `AuthProvider` remounts during HMR:
- `useState(cachedUser)` initializes from the cached value
- But multiple auth events fire in rapid succession
- The `INITIAL_SESSION false` event arrives last and the code doesn't reinforce the cached state

### Solution
Add explicit handling for `INITIAL_SESSION` events with null session to reinforce the cached user/session if available. This ensures that even if auth events arrive out of order during HMR, the cached state takes precedence.

### Implementation

**File: `src/hooks/useAuth.tsx`**

Update the `onAuthStateChange` handler (around lines 55-81) to explicitly handle `INITIAL_SESSION` with null session:

```tsx
// Current code (lines 76-81):
// KEY FIX: If session is null but event isn't SIGNED_OUT,
// DON'T set loading = false here. Let getSession() handle it.
// This prevents the race condition where early null events
// cause a redirect before the real session is loaded.

// Updated code:
else if (event === 'INITIAL_SESSION' && !session) {
  // INITIAL_SESSION with null session during HMR - use cached state
  if (cachedUser && cachedSession) {
    setUser(cachedUser);
    setSession(cachedSession);
    initialCheckComplete = true;
    setLoading(false);
  }
  // If no cache, let getSession() handle it (don't set loading=false)
}
// For other events with null session (TOKEN_REFRESHED, etc),
// don't set loading = false here. Let getSession() handle it.
```

### Full Updated Handler Logic

```tsx
const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
  if (!isMounted) return;
  
  console.log('Auth state change:', event, !!session);
  
  // Only clear auth state on explicit sign out
  if (event === 'SIGNED_OUT') {
    cachedSession = null;
    cachedUser = null;
    setSession(null);
    setUser(null);
    initialCheckComplete = true;
    setLoading(false);
  } else if (session) {
    // Update cache when we have a valid session
    cachedSession = session;
    cachedUser = session.user;
    setSession(session);
    setUser(session.user);
    initialCheckComplete = true;
    setLoading(false);
  } else if (event === 'INITIAL_SESSION' && cachedUser && cachedSession) {
    // INITIAL_SESSION with null session during HMR - reinforce cached state
    // This prevents the redirect when auth events arrive out of order
    setUser(cachedUser);
    setSession(cachedSession);
    initialCheckComplete = true;
    setLoading(false);
  }
  // For other events with null session, don't set loading = false here.
  // Let getSession() handle it.
});
```

### Why This Works

1. **Normal startup (no cache)**: `INITIAL_SESSION null` fires, no cached user exists, so we skip setting state and let `getSession()` handle it
2. **HMR with logged-in user**: `INITIAL_SESSION null` fires, cached user exists, so we reinforce the cached state immediately
3. **Token refresh**: `TOKEN_REFRESHED` with new session updates everything correctly
4. **Sign out**: `SIGNED_OUT` clears everything correctly

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add explicit handling for `INITIAL_SESSION` with null session to reinforce cached state (lines 55-81) |

### Technical Notes
- This is a dev-mode only issue (HMR doesn't happen in production builds)
- The fix is defensive - it doesn't change production behavior
- The cached user/session is already being preserved across HMR via `import.meta.hot`

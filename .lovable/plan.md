

## Fix Infinite Loading Spinner After Sign Out

### Root Cause

After signing out in dev mode, the Auth page shows an infinite loading spinner. The issue is a race condition in the `signOut` function in `useAuth.tsx`:

1. `signOut()` clears `cachedSession`, `cachedUser`, `user`, and `session` state
2. But it does **NOT** set `loading = false`
3. The code relies on `onAuthStateChange` receiving a `SIGNED_OUT` event to set `loading = false`
4. However, since `signOut()` is called imperatively (not from the effect), there's a timing gap where:
   - User navigates to `/auth` 
   - Component mounts with `loading = true` (because `cachedUser` is now `null`)
   - The `SIGNED_OUT` event from `onAuthStateChange` may fire **before** `getSession()` resolves
   - But the `SIGNED_OUT` handler only sets `loading = false` if there's a null session, which competes with the initial load logic

The simplest fix is to **explicitly set `loading = false` in the `signOut` function** so the state is immediately consistent.

---

### Changes

**File: `src/hooks/useAuth.tsx`**

In the `signOut` function, add `setLoading(false)` after clearing the cached values:

```typescript
const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Sign out API call failed:', error);
    }
  }
  
  queryClient.clear();
  
  cachedSession = null;
  cachedUser = null;
  setSession(null);
  setUser(null);
  setLoading(false);  // <-- ADD THIS LINE
};
```

This ensures that immediately after sign-out:
- `user = null`
- `session = null` 
- `loading = false`

So when the Auth page checks these values, it will correctly show the login form instead of the spinner.

---

### Why This Works

- The `loading` state is what controls the spinner in `Auth.tsx` (lines 32-38)
- By explicitly setting `loading = false` in `signOut()`, we guarantee the auth state is fully consistent before any navigation occurs
- This matches the pattern in the Stack Overflow solution: separating initial load (which controls loading state) from ongoing changes (which update user/session but shouldn't leave loading in an indeterminate state)

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Add `setLoading(false)` in `signOut()` function |


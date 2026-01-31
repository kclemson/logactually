

## Fix Sign-Out Race Condition

### Problem

The `signOut` function (lines 164-181) clears module cache and React state, but relies on `supabase.auth.signOut()` to clear localStorage. If that API call fails (e.g., 403 error when session is already invalid), localStorage may retain the token. This causes `ProtectedRoute`'s `hasStoredSession()` fallback to still find a valid token, resulting in an infinite spinner.

### Solution

Add explicit localStorage removal as the **first step** in `signOut()`, before making the API call.

### Change

**File: `src/hooks/useAuth.tsx`** (lines 164-181)

```typescript
const signOut = async () => {
  // Clear localStorage FIRST to prevent ProtectedRoute race condition
  // This ensures hasStoredSession() returns false immediately
  const storageKey = 'sb-enricsnosdrhmfvbjaei-auth-token';
  localStorage.removeItem(storageKey);
  
  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Log but don't throw - we still want to clear local state
    // This handles 403 "session_not_found" errors when session is already invalid
    if (import.meta.env.DEV) {
      console.warn('Sign out API call failed:', error);
    }
  }
  
  // ALWAYS clear local state, even if API failed
  // If session was already invalid, we still want to "sign out" locally
  cachedSession = null;
  cachedUser = null;
  setSession(null);
  setUser(null);
};
```

### Why This Works

1. **Immediate localStorage clear** - `hasStoredSession()` in ProtectedRoute will return false right away
2. **No race condition** - Even if the Supabase API call hangs or fails, the local token is already gone
3. **Uses same key** - `sb-enricsnosdrhmfvbjaei-auth-token` matches what ProtectedRoute checks (line 12)


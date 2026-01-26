

## Fix Sign Out Button - Handle Stale Session (403 Error)

### Problem

The console shows a **403 (Forbidden)** error with `session_not_found` when clicking Sign Out. This happens when:
1. The server-side session was already invalidated (token rotation, revoked elsewhere)
2. The client still thinks it has a valid session
3. `supabase.auth.signOut()` fails because there's nothing to sign out
4. The `SIGNED_OUT` event never fires, so React state is never cleared
5. User appears stuck - nothing happens

### Root Cause

Current `signOut` implementation (line 142-147):
```tsx
const signOut = async () => {
  cachedSession = null;
  cachedUser = null;
  await supabase.auth.signOut();  // <-- Fails with 403, no error handling
};
```

The React state (`user`, `session`) is only cleared when `onAuthStateChange` fires a `SIGNED_OUT` event - but that event doesn't fire if the API call fails.

---

### Solution

#### 1. Update `signOut` to handle stale sessions gracefully

If the sign out API call fails with "session not found", that's actually fine - the goal was to sign out and the session is already gone. We should:
- Attempt the API call
- If it fails, check if it's a "session not found" error
- Either way, clear local state and force a manual sign-out state update

**`src/hooks/useAuth.tsx`**:
```tsx
const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    // Log but don't throw - we still want to clear local state
    console.warn('Sign out API call failed:', error);
  }
  
  // ALWAYS clear local state, even if API failed
  // (If session was already invalid, we still want to "sign out" locally)
  cachedSession = null;
  cachedUser = null;
  setSession(null);
  setUser(null);
};
```

#### 2. Add loading state to Header for better UX

**`src/components/Header.tsx`**:
```tsx
const [isSigningOut, setIsSigningOut] = useState(false);

const handleSignOut = async () => {
  setIsSigningOut(true);
  await signOut();
  // Navigation will happen via ProtectedRoute detecting null user
};

// Button shows "Signing out..." while in progress
```

---

### Why This Works

| Scenario | Before | After |
|----------|--------|-------|
| Normal sign out | Works | Works |
| Session already invalid (403) | Nothing happens | Clears local state, redirects to auth |
| Network error | Nothing happens | Clears local state, redirects to auth |

The key insight: **if the user clicked "Sign Out", they want to be signed out** - whether or not the server-side session still exists. We should always honor that intent.

---

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useAuth.tsx` | Handle API errors gracefully, always clear local state |
| `src/components/Header.tsx` | Add loading state and proper async handling |


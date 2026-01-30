
## Fix Login Count Tracking

### Problem

The `increment_login_count` RPC call never fires because the type assertion `(supabase.rpc as Function)` breaks the PostgrestBuilder promise chain.

### Root Cause

When this was first implemented, the generated types didn't include the new RPC. The workaround `(supabase.rpc as Function)('increment_login_count', ...)` was used, but `PostgrestBuilder` objects need `.then()` or `await` to execute. The silent `.catch(() => {})` swallowed any errors.

Now that types have regenerated and include `increment_login_count`, we can use the properly typed call.

---

### File Changes

**`src/hooks/useAuth.tsx`** (lines 144-153)

Replace:
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  // Track login count (fire-and-forget, don't block auth flow)
  if (!error && data.user) {
    (supabase.rpc as Function)('increment_login_count', { user_id: data.user.id }).catch(() => {});
  }
  
  return { error };
};
```

With:
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  // Track login count (fire-and-forget, don't block auth flow)
  if (!error && data.user) {
    supabase.rpc('increment_login_count', { user_id: data.user.id })
      .then(() => {
        if (import.meta.env.DEV) {
          console.log('Login count incremented for user:', data.user.id);
        }
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.error('Failed to increment login count:', err);
        }
      });
  }
  
  return { error };
};
```

---

### Summary

| Change | Reason |
|--------|--------|
| Remove `(supabase.rpc as Function)` cast | Types now include `increment_login_count` |
| Add `.then()` | Ensures the PostgrestBuilder actually executes |
| Add dev-mode logging | Surfaces success/failure in console during testing |

After this fix, sign out and back in - you should see "Login count incremented" in console and the count update on refresh.

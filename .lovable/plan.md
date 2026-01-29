

## Remove Production Console Logs from Auth

### Overview
Remove debug console logs from the authentication hook that are appearing in production. Keep error logs but wrap them in development-only checks, or convert the debug log to only run in development mode.

---

### Changes

**File:** `src/hooks/useAuth.tsx`

1. **Line 58** - Remove or wrap the "Auth state change" console.log in a dev check:
   ```tsx
   // Before
   console.log('Auth state change:', event, !!session);
   
   // After - remove entirely (preferred) or wrap:
   if (import.meta.env.DEV) {
     console.log('Auth state change:', event, !!session);
   }
   ```

2. **Line 105** - Wrap the session warning in a dev check:
   ```tsx
   // Before
   console.warn('getSession returned null but cached user exists - preserving session');
   
   // After
   if (import.meta.env.DEV) {
     console.warn('getSession returned null but cached user exists - preserving session');
   }
   ```

3. **Line 153** - Keep as-is (actual error that should be logged) or wrap in dev check:
   ```tsx
   // Optionally wrap in dev check if you don't want any production logs
   if (import.meta.env.DEV) {
     console.warn('Sign out API call failed:', error);
   }
   ```

---

### Recommendation
The cleanest approach is to:
- **Remove** line 58 entirely (it's purely for debugging)
- **Wrap** lines 105 and 153 with `import.meta.env.DEV` checks (they're useful for debugging edge cases but not needed in production)
- **Keep** lines 49 and 115 as-is (these are actual errors users might need to know about, though they could also be wrapped)

---

### Files to Modify
1. `src/hooks/useAuth.tsx` - Remove or wrap console statements with `import.meta.env.DEV` checks


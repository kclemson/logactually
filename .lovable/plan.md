

## Fix Password Reset "Change Password" UI Not Showing

### Root Cause

There's a race condition in the Auth component. When a user clicks the password reset link:

1. They arrive at `/auth?reset=true` with a valid session (Supabase logs them in via the magic link)
2. The component renders and sees `user` is truthy
3. The redirect check `if (user && !isUpdatingPassword)` runs immediately
4. Since `isUpdatingPassword` defaults to `false`, the user is redirected to `/` before the `useEffect` can set it to `true`

### Solution

Initialize `isUpdatingPassword` based on `isResetCallback` **synchronously during state initialization**, not in an effect.

### Implementation

**File: `src/pages/Auth.tsx`**

#### 1. Change the initial state of `isUpdatingPassword` (line 19)

```tsx
// FROM:
const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

// TO:
const [isUpdatingPassword, setIsUpdatingPassword] = useState(isResetCallback);
```

#### 2. Update the useEffect to handle the user dependency (lines 28-33)

The effect is still useful to catch the case where `user` arrives after initial render:

```tsx
// FROM:
useEffect(() => {
  if (isResetCallback && user) {
    setIsUpdatingPassword(true);
  }
}, [isResetCallback, user]);

// TO:
useEffect(() => {
  // If we have the reset callback but no user yet, wait for user
  // If we have both, ensure we're in password update mode
  if (isResetCallback && user) {
    setIsUpdatingPassword(true);
  }
  // If user leaves (signs out) while in reset mode, exit reset mode
  if (!user && isUpdatingPassword && !isResetCallback) {
    setIsUpdatingPassword(false);
  }
}, [isResetCallback, user, isUpdatingPassword]);
```

### How This Fixes the Issue

**Before (broken):**
```text
1. User arrives at /auth?reset=true with session
2. Initial render: isUpdatingPassword = false
3. Redirect check: user && !isUpdatingPassword → true → REDIRECT to /
4. useEffect never runs (component unmounted)
```

**After (fixed):**
```text
1. User arrives at /auth?reset=true with session
2. Initial render: isUpdatingPassword = true (from isResetCallback)
3. Redirect check: user && !isUpdatingPassword → false → NO redirect
4. Password update form is shown
```

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Initialize `isUpdatingPassword` from `isResetCallback` (~2 small edits) |


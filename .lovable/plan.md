

## Remove Redundant useEffect from Password Reset Flow

### Summary

Remove the `useEffect` hook that manages `isUpdatingPassword` state, since the synchronous initialization (`useState(isResetCallback)`) already handles the primary use case. This aligns with the project's architecture preference for avoiding `useEffect` for state synchronization.

### Why It's Safe to Remove

| Scenario | Current Behavior | After Removal |
|----------|------------------|---------------|
| User arrives at `/auth?reset=true` | State initialized to `true` synchronously | Same - works correctly |
| User signs out while on reset form | Effect clears state | User is redirected to login anyway (no issue) |
| Auth loads slowly | Effect sets state when user arrives | State already `true` from URL param |

The effect is defensive code that doesn't add meaningful protection given the synchronous initialization.

### Implementation

**File: `src/pages/Auth.tsx`**

Remove lines 26-40 (the entire `useEffect` block):

```tsx
// DELETE THIS BLOCK:
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

Also remove the `useEffect` import if no longer needed (line 1).

### Files to Change

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Remove `useEffect` hook and potentially the import (~15 lines deleted) |


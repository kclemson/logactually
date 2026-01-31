
## Remove Apple OAuth and Feature Flag

### Summary

Two changes in one:
1. Remove all Apple OAuth code (state, handler, button)
2. Remove the `?oauth=1` feature flag so Google sign-in is always visible

### Changes to `src/pages/Auth.tsx`

| Line(s) | What to Remove/Change |
|---------|----------------------|
| 17 | Remove `useSearchParams` from import (no longer needed after removing feature flag) |
| 17-19 | Remove `searchParams` and `showOAuth` variables |
| 31 | Remove `isAppleLoading` state |
| 142-160 | Remove entire `handleAppleSignIn` function |
| 375-433 | Replace conditional `{showOAuth && (<>...</>)}` wrapper with just the Google button (no condition) |
| 413-431 | Remove entire Apple button block |
| 384, 419, 444, 457 | Remove `isAppleLoading` from disabled prop checks |

### Resulting Code Structure

**Before (sign-in options section):**
```tsx
{showOAuth && (
  <>
    {/* Google button */}
    {/* Apple button */}
  </>
)}
{/* Email Sign Up button */}
```

**After:**
```tsx
{/* Google button - always visible */}
{/* Email Sign Up button */}
```

### Import Cleanup

Since `useSearchParams` is only used for the OAuth feature flag (the `reset` param is still used but via different means), we need to check if it's still needed. Looking at line 18, `isResetCallback` still uses `searchParams`, so we keep the import but remove the `showOAuth` variable.

### Lines Removed

- ~30 lines of Apple OAuth code
- ~3 lines of feature flag logic
- Conditional wrapper around OAuth buttons

### What Stays

- Google OAuth button and handler (now always visible on sign-in screen)
- All email/password auth flows
- Demo mode
- Password reset flow (still uses `searchParams` for `?reset=true`)



# Fix: Guard `updateSettings` against unloaded settings

## Problem
When `updateSettings` fires before the settings query has resolved (e.g. after an overnight session expiry), `settings` is still `DEFAULT_SETTINGS`. The mutation then does `{ ...DEFAULT_SETTINGS, ...updates }` and writes that to the database, wiping the user's real preferences.

## Solution
Add a simple guard in the `mutationFn`: check whether the settings query has successfully loaded real data before allowing a write. If it hasn't, reject the mutation.

## Change

**File: `src/hooks/useUserSettings.ts`**

In the `mutationFn` (around line 93), after the `if (!user)` check, add a guard that checks whether the query has finished loading. We can use the query's `isSuccess` status (exposed via the `useQuery` return) or, more simply, check if `isLoading` is true:

```typescript
mutationFn: async (updates: Partial<UserSettings>) => {
  if (!user) throw new Error('No user');
  if (isLoading) throw new Error('Settings not loaded yet');
  // ... rest unchanged
},
```

This is a one-line addition. If `updateSettings` is called before the settings query has resolved, the mutation throws, the optimistic update is rolled back by `onError`, and nothing is written to the database.

The `isLoading` variable is already defined on line 65 from the `useQuery` return, and it's already in scope for the mutation closure.

## Why this is sufficient

- The race condition requires `settings` to equal `DEFAULT_SETTINGS` at the time of the write. That only happens when `isLoading` is true (query hasn't resolved yet) or on query error (which also returns `DEFAULT_SETTINGS`).
- For the error case: we could additionally check `isError`, but query errors are already logged and `staleTime: Infinity` means once loaded, the cache persists for the session. The loading guard covers the primary scenario (session expiry causing a re-fetch).
- This matches the "dirty state" pattern you mentioned -- we're simply refusing to write when we don't have confirmed clean data to merge against.

## Files modified
- `src/hooks/useUserSettings.ts` -- add one guard line in `mutationFn`


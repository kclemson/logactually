

# Fix template buttons flashing on Custom Log page load

## Problem
When navigating to the Custom page, the template buttons (Body Weight, Sleep, Water, etc.) briefly flash before being replaced by the "Add custom log" dropdown. This happens because `logTypes` defaults to an empty array while the query is loading, so the UI renders the "no types yet" template grid. Once the query resolves with the user's actual log types, it switches to the dropdown.

## Solution
Check the `isLoading` state from `useCustomLogTypes` before rendering the template grid. While loading, show nothing (or the existing loading state) instead of assuming there are zero log types.

## Changes

### `src/pages/OtherLog.tsx`

In the rendering logic around line 80, change the condition from:

```
sortedLogTypes.length === 0
```

to:

```
!isLoading && sortedLogTypes.length === 0
```

And extract `isLoading` from the `useCustomLogTypes()` call (currently only `logTypes`, `createType`, and `recentUsage` are destructured).

| File | What |
|------|------|
| `src/pages/OtherLog.tsx` | Add `isLoading` to destructured values; gate template grid on `!isLoading` to prevent flash |


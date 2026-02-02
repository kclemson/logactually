

## Admin Page: Show Spinner While Loading Users

### Problem
When the admin page loads, it briefly shows "No users found" before the user stats data arrives. This happens because the `useAdminUserStats()` hook's `isLoading` state isn't being checked.

### Solution
Destructure `isLoading` from `useAdminUserStats()` and show a spinner instead of "No users found" while loading.

---

### File Changed

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add loading check for user stats table |

---

### Code Changes

**Line 31 - Destructure isLoading:**
```tsx
// Before
const { data: userStats } = useAdminUserStats();

// After
const { data: userStats, isLoading: isUserStatsLoading } = useAdminUserStats();
```

**Lines 113-227 - Add loading state to condition:**
```tsx
// Before
{userStats && userStats.length > 0 ? (
  <TooltipProvider>...</TooltipProvider>
) : (
  <p className="text-muted-foreground text-xs">No users found.</p>
)}

// After
{isUserStatsLoading ? (
  <div className="flex justify-center py-4">
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
) : userStats && userStats.length > 0 ? (
  <TooltipProvider>...</TooltipProvider>
) : (
  <p className="text-muted-foreground text-xs">No users found.</p>
)}
```

This keeps the spinner small and inline (h-4 w-4) since it's just for the users table section, not the whole page.


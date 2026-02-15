

# Hide inactive users in Admin users table

Filter out users whose last active date is more than 2 weeks ago from the admin users table.

## Technical change

**File:** `src/pages/Admin.tsx`

Add a filter on the `userStats` array before rendering, using `date-fns` (already imported) to check if `last_active` is within the last 14 days. Users with no `last_active` value will also be hidden.

```typescript
const activeUserStats = userStats?.filter(user => {
  if (!user.last_active) return false;
  const lastActive = parseISO(user.last_active);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  return lastActive >= twoWeeksAgo;
});
```

Then replace references to `userStats` in the table rendering section with `activeUserStats`.




## Add Weight Tracking Stats to Admin Dashboard

Rename "Logged Items" columns to "Food logged" and add new "Weight logged" columns to both user and daily stats tables.

---

### Overview

| Component | Action | Purpose |
|-----------|--------|---------|
| Database function `get_usage_stats` | **Modify** | Add weight tracking stats to daily_stats |
| Database function `get_user_stats` | **Modify** | Add weight entries per user |
| `src/hooks/useAdminStats.ts` | **Modify** | Update TypeScript interfaces |
| `src/pages/Admin.tsx` | **Modify** | Rename columns, add weight columns |

---

### Database Changes

**1. Update `get_user_stats` function**

Add weight set counts per user:

```sql
SELECT 
  p.id as user_id,
  p.user_number,
  COUNT(fe.id) as total_entries,           -- renamed to total_food_entries
  COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today,  -- renamed to food_today
  COUNT(DISTINCT ws.id) as total_weight_entries,  -- NEW
  COUNT(DISTINCT CASE WHEN ws.logged_date = local_today THEN ws.id END) as weight_today,  -- NEW
  GREATEST(MAX(fe.created_at), MAX(ws.created_at)) as last_active  -- updated to include weights
FROM profiles p
LEFT JOIN food_entries fe ON p.id = fe.user_id
LEFT JOIN weight_sets ws ON p.id = ws.user_id  -- NEW join
GROUP BY p.id, p.user_number
```

**2. Update `get_usage_stats` function**

Add weight count to daily_stats:

```sql
-- In the daily_stats subquery, add:
COALESCE(w.weight_count, 0) as weight_count

-- Add new join:
LEFT JOIN (
  SELECT logged_date, COUNT(*) as weight_count
  FROM weight_sets
  GROUP BY logged_date
) w ON d.stat_date = w.logged_date
```

---

### TypeScript Changes

**File: `src/hooks/useAdminStats.ts`**

Update interfaces:

```typescript
interface DailyStats {
  stat_date: string;
  entry_count: number;      // Keep as food entries
  weight_count: number;     // NEW
  total_users: number;
  users_with_entries: number;
  users_created: number;
}

interface UserStats {
  user_id: string;
  user_number: number;
  total_entries: number;    // Rename to total_food_entries conceptually
  entries_today: number;    // Rename to food_today conceptually
  total_weight_entries: number;  // NEW
  weight_today: number;          // NEW
  last_active: string | null;
}
```

---

### UI Changes

**File: `src/pages/Admin.tsx`**

**User stats table (lines 84-107):**

| Before | After |
|--------|-------|
| "Total Logged Items" | "Food Logged" |
| "Items Logged Today" | "Food Today" |
| — | "Weight Logged" (new) |
| — | "Weight Today" (new) |

```tsx
<tr className="border-b">
  <th>User</th>
  <th>Food Logged</th>      {/* was "Total Logged Items" */}
  <th>Food Today</th>        {/* was "Items Logged Today" */}
  <th>Weight Logged</th>     {/* NEW */}
  <th>Weight Today</th>      {/* NEW */}
  <th>Last Active</th>
</tr>
```

**Daily stats table (lines 116-134):**

| Before | After |
|--------|-------|
| "Logged Items" | "Food Logged" |
| — | "Weight Logged" (new) |

```tsx
<tr className="border-b">
  <th>Date</th>
  <th>Food Logged</th>       {/* was "Logged Items" */}
  <th>Weight Logged</th>     {/* NEW */}
  <th>Users</th>
  <th>Users w/Logged Items</th>
  <th>New Users</th>
</tr>
```

---

### Files Summary

| File | Changes |
|------|---------|
| Database migration | Update `get_user_stats` and `get_usage_stats` functions |
| `src/hooks/useAdminStats.ts` | Add `weight_count`, `total_weight_entries`, `weight_today` to interfaces |
| `src/pages/Admin.tsx` | Rename columns, add weight columns and data cells |




## Update User Stats to Use login_events Table

### Overview

Replace the `profiles.login_count` counter with queries against the `login_events` table, enabling per-user time-windowed login metrics.

---

### Database Changes

#### Update `get_user_stats` Function

Replace `p.login_count` with counts from `login_events`:

```sql
-- Replace this:
p.login_count

-- With these:
(SELECT COUNT(*) FROM login_events le WHERE le.user_id = p.id) as login_count,
(SELECT COUNT(*) FROM login_events le 
 WHERE le.user_id = p.id 
 AND le.created_at > NOW() - INTERVAL '24 hours') as logins_today
```

---

### TypeScript Changes

#### Update `UserStats` Interface

**File: `src/hooks/useAdminStats.ts`**

Add `logins_today` field:

```typescript
interface UserStats {
  // ... existing fields
  login_count: number;
  logins_today: number;  // NEW
}
```

---

### UI Changes

**File: `src/pages/Admin.tsx`**

Add "L2day" column to user stats table:

| Header | Description |
|--------|-------------|
| Logins | Total logins (from `login_events`) |
| L2day | Logins in last 24 hours |

```tsx
// Table header
<th className="text-center py-0.5 font-medium text-muted-foreground">Logins</th>
<th className="text-center py-0.5 font-medium text-muted-foreground">L2day</th>

// Table row
<td className={`text-center py-0.5 pr-2 ${(user.login_count ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}>
  {user.login_count ?? 0}
</td>
<td className={`text-center py-0.5 ${(user.logins_today ?? 0) === 0 ? "text-muted-foreground/50" : ""}`}>
  {user.logins_today ?? 0}
</td>
```

---

### Optional Cleanup

Consider removing `login_count` column from `profiles` table in a future migration since it's now redundant. For now, we can leave it as a backup/historical reference.

---

### Data Reset Note

Since `login_events` is a new table, all users will show 0 logins initially. Going forward, every login will be tracked with full timestamp data.

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Update `get_user_stats` to query `login_events` |
| `src/hooks/useAdminStats.ts` | Add `logins_today` to `UserStats` interface |
| `src/pages/Admin.tsx` | Add "L2day" column to user stats table |


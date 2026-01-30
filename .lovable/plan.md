

## Add Demo Logins to Admin Dashboard

### Overview

Replace the "w/logged items" row (which is always 100%) with "Demo logins: #" under the Users header.

---

### Changes Required

#### 1. Database Function Update

**Add `demo_logins` to `get_usage_stats` response**

The `get_usage_stats` RPC needs a new field that fetches the login count for the read-only (demo) user:

```sql
'demo_logins', (
  SELECT COALESCE(login_count, 0) 
  FROM profiles 
  WHERE is_read_only = true 
  LIMIT 1
)
```

---

#### 2. Frontend Changes

**`src/hooks/useAdminStats.ts`**

Add to `UsageStats` interface:
```typescript
demo_logins: number;
```

**`src/pages/Admin.tsx`**

Replace line 63-65:
```tsx
<p>
  w/logged items: {stats?.users_with_entries ?? 0} ({pct(stats?.users_with_entries ?? 0)}%)
</p>
```

With:
```tsx
<p>Demo logins: {stats?.demo_logins ?? 0}</p>
```

---

### Summary

| Component | Change |
|-----------|--------|
| Database | Add `demo_logins` field to `get_usage_stats` RPC |
| TypeScript | Add `demo_logins: number` to `UsageStats` interface |
| Admin UI | Replace "w/logged items" with "Demo logins: #" |

After this, the admin dashboard will show how many times the demo account has been signed into.


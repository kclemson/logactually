

## Reorganize Admin Stats Layout + Add Saved Routines Count

### New Layout

```text
┌─────────────────┬─────────────────┬──────────────────┐
│ Users: X        │ Demo logins: Z  │ Saved Meals: A   │
│ Logged Items: Y │                 │ Saved Routines: B│
└─────────────────┴─────────────────┴──────────────────┘
```

---

### Changes Required

#### 1. Database Migration
Add `total_saved_routines` to the `get_usage_stats` function:

```sql
'total_saved_routines', (
  SELECT COUNT(*) FROM saved_routines sr
  JOIN profiles p ON sr.user_id = p.id
  WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
)
```

#### 2. Update TypeScript Types
**File: `src/hooks/useAdminStats.ts`**

Add to `UsageStats` interface:
```typescript
total_saved_routines: number;
```

#### 3. Reorganize Admin Layout
**File: `src/pages/Admin.tsx` (lines 89-115)**

Replace the current 3-column, 2-row grid with:

```tsx
<div className="grid grid-cols-[auto_auto_auto] gap-x-4 text-muted-foreground text-xs">
  {/* First column */}
  <div className="space-y-0">
    <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
    <p className="font-medium">Logged Items: {stats?.total_entries ?? 0}</p>
  </div>
  
  {/* Second column */}
  <div>
    <p>Demo logins: {stats?.demo_logins ?? 0}</p>
  </div>
  
  {/* Third column */}
  <div className="space-y-0">
    <p>Saved Meals: {stats?.total_saved_meals ?? 0}</p>
    <p>Saved Routines: {stats?.total_saved_routines ?? 0}</p>
  </div>
</div>
```

---

### Files Changed

| File | Change |
|------|--------|
| Database migration | Add `total_saved_routines` to `get_usage_stats` function |
| `src/hooks/useAdminStats.ts` | Add `total_saved_routines` to `UsageStats` interface |
| `src/pages/Admin.tsx` | Reorganize stats grid to new 3-column layout |


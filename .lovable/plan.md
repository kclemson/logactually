
## Align Header and Sub-stats Rows

### Problem
The header row ("Users: 5", "Entries: 47", "Saved Meals: 3") and sub-stats row are separate CSS grids. Even though both use `grid-cols-[auto_auto_auto]`, columns don't align because each grid calculates its own column widths independently.

### Solution
Combine both rows into a single 3-column grid, where:
- Row 1: Header cells (Users, Entries, Saved Meals totals)
- Row 2: Sub-stat cells (each cell contains multiple lines)

This ensures all content shares the same column tracks.

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Merge into single grid (lines 46-80)

Current structure:
```tsx
{/* Row 1: Headers with totals */}
<div className="grid grid-cols-[auto_auto_auto] gap-1 ...">
  <p>Users: 5</p>
  <p>Entries: 47</p>
  <p>Saved Meals: 3</p>
</div>

{/* Row 2: Sub-stats in 3 columns */}
<div className="grid grid-cols-[auto_auto_auto] gap-1 ...">
  <div>...</div>
  <div>...</div>
  <div>...</div>
</div>
```

New structure (single grid with 6 cells across 2 rows):
```tsx
{/* Stats grid: 3 columns, 2 rows */}
<div className="grid grid-cols-[auto_auto_auto] gap-x-1 gap-y-0.5 text-muted-foreground text-xs">
  {/* Row 1: Headers */}
  <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
  <p className="font-medium">Entries: {stats?.total_entries ?? 0}</p>
  <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>

  {/* Row 2: Sub-stats (each cell wraps to grid row 2) */}
  <div className="space-y-0">
    <p>W/entries: {stats?.users_with_entries ?? 0} ({pct(...)}%)</p>
    <p>Active RL7: {stats?.active_last_7_days ?? 0} ({pct(...)}%)</p>
    <p>Created RL7: {stats?.users_created_last_7_days ?? 0} ({pct(...)}%)</p>
  </div>
  <div className="space-y-0">
    <p>Avg/user: {avgEntriesPerUser}</p>
    <p>Created RL7: {stats?.entries_created_last_7_days ?? 0}</p>
  </div>
  <div className="space-y-0">
    <p>Users w/SM: {stats?.users_with_saved_meals ?? 0}</p>
    <p>Avg/user: {stats?.avg_saved_meals_per_user ?? 0}</p>
    <p>Used RL7: {stats?.saved_meals_used_last_7_days ?? 0}</p>
  </div>
</div>
```

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| Grid structure | 2 separate grids | 1 unified grid |
| Column alignment | Independent | Shared column tracks |
| Gap | `gap-1` (uniform) | `gap-x-1 gap-y-0.5` (tighter vertical) |

---

### Result
- Headers and sub-stats columns will always align perfectly
- Single grid ensures consistent column widths across both rows

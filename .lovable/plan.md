

## Admin Page Density Improvements

### Overview
Make the Admin page more compact by:
1. Reducing table padding/spacing
2. Reducing font sizes across the page
3. Removing the "Admin Stats" heading

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Change 1: Remove "Admin Stats" heading (line 55)

Delete the entire line:
```tsx
<h1 className="font-semibold text-heading">Admin Stats</h1>
```

#### Change 2: Reduce font sizes by one stop

| Element | Current | New |
|---------|---------|-----|
| Stats row 1 (headers) | Default (14px/16px) | `text-xs` (12px) |
| Stats row 2 (sub-stats) | `text-sm` | `text-xs` (12px) |
| Daily stats table | Default | `text-xs` on table |
| User stats table | Default | `text-xs` on table |

#### Change 3: Reduce table padding

Current table cells use `py-1 pr-4`. Change to:
- `py-0.5 pr-2` for tighter vertical and horizontal spacing

---

### Updated Code Structure

**Lines 53-55 (container start):**
```tsx
return (
  <div className="p-4 space-y-3">
    {/* "Admin Stats" heading removed */}
```

**Lines 57-62 (stats row 1):**
```tsx
<div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
  <p className="font-medium">Users: {stats?.total_users ?? 0}</p>
  <p className="font-medium">Entries: {stats?.total_entries ?? 0}</p>
  <p className="font-medium">Saved Meals: {stats?.total_saved_meals ?? 0}</p>
</div>
```

**Lines 64-85 (stats row 2):**
```tsx
<div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
  {/* ... same content, just smaller text */}
</div>
```

**Lines 87-109 (daily stats table):**
```tsx
<table className="w-auto mt-3 text-xs">
  <thead>
    <tr className="border-b">
      <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">Date</th>
      <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Entries</th>
      <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Users</th>
      <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">With Entries</th>
      <th className="text-center py-0.5 font-medium text-muted-foreground">New Users</th>
    </tr>
  </thead>
  <tbody>
    {stats.daily_stats.slice(0, 3).map((row) => (
      <tr key={row.stat_date} className="border-b border-border/50">
        <td className="py-0.5 pr-2">{format(parseISO(row.stat_date), 'MMM-dd')}</td>
        <td className="text-center py-0.5 pr-2">{row.entry_count}</td>
        <td className="text-center py-0.5 pr-2">{row.total_users}</td>
        <td className="text-center py-0.5 pr-2">{row.users_with_entries}</td>
        <td className="text-center py-0.5">{row.users_created}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**Lines 114-132 (user stats table):**
```tsx
<table className="w-auto mt-4 text-xs">
  <thead>
    <tr className="border-b">
      <th className="text-left py-0.5 pr-2 font-medium text-muted-foreground">User</th>
      <th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Total Entries</th>
      <th className="text-center py-0.5 font-medium text-muted-foreground">Today</th>
    </tr>
  </thead>
  <tbody>
    {userStats.map((user, index) => (
      <tr key={user.user_id} className="border-b border-border/50">
        <td className="py-0.5 pr-2">User {index + 1}</td>
        <td className="text-center py-0.5 pr-2">{user.total_entries}</td>
        <td className="text-center py-0.5">{user.entries_today}</td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### Summary of Changes

| Aspect | Before | After |
|--------|--------|-------|
| "Admin Stats" heading | Present | Removed |
| Stats grid font | Default / `text-sm` | `text-xs` |
| Stats grid gap | `gap-4` | `gap-2` |
| Table font | Default | `text-xs` |
| Table cell padding | `py-1 pr-4` | `py-0.5 pr-2` |
| Table margins | `mt-4` / `mt-6` | `mt-3` / `mt-4` |
| Container spacing | `space-y-4` | `space-y-3` |

---

### Result
- More compact, data-dense admin view
- Smaller text throughout (12px instead of 14px)
- Tighter table cells for better scannability
- No unnecessary heading taking up vertical space


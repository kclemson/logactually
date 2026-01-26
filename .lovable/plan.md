

## Reorganize Admin Page Layout

### Overview
Reorder the content sections, convert the user stats from tabular to textual format, and add more vertical spacing between sections.

---

### Changes

**File: `src/pages/Admin.tsx`**

#### 1. Increase vertical spacing between sections

Current container:
```tsx
<div className="px-1 py-2 space-y-2">
```

New container:
```tsx
<div className="px-1 py-2 space-y-4">
```

Changes `space-y-2` (8px) to `space-y-4` (16px) for clearer visual separation.

---

#### 2. Move user stats section above the date table

Current order:
1. Stats grid (Users/Entries/Saved Meals)
2. Daily stats table
3. User stats table

New order:
1. Stats grid (Users/Entries/Saved Meals)
2. User stats (textual format)
3. Daily stats table

---

#### 3. Convert user stats from table to textual format

Current (lines 97-118):
```tsx
{userStats && userStats.length > 0 ? (
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
) : (
  <p className="text-muted-foreground text-xs">No users found.</p>
)}
```

New (textual format):
```tsx
{userStats && userStats.length > 0 ? (
  <div className="text-xs text-muted-foreground space-y-0.5">
    {userStats.map((user, index) => (
      <p key={user.user_id}>
        User {index + 1}: {user.total_entries} total entries ({user.entries_today} today)
      </p>
    ))}
  </div>
) : (
  <p className="text-muted-foreground text-xs">No users found.</p>
)}
```

---

### Final Section Order

```text
┌─────────────────────────────────────────────┐
│ Section 1: Stats Grid                       │
│ Users: 5        Entries: 47   Saved Meals: 3│
│ W/entries: 5... Avg/user...   Users w/SM... │
├─────────────────────────────────────────────┤
│                  16px gap                   │
├─────────────────────────────────────────────┤
│ Section 2: User Details (textual)           │
│ User 1: 27 total entries (2 today)          │
│ User 2: 15 total entries (0 today)          │
│ ...                                         │
├─────────────────────────────────────────────┤
│                  16px gap                   │
├─────────────────────────────────────────────┤
│ Section 3: Daily Stats Table                │
│ Date    Entries  Users  With Entries  New   │
│ Jan-26  5        5      5             0     │
│ ...                                         │
└─────────────────────────────────────────────┘
```

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| Section order | Stats → Dates → Users | Stats → Users → Dates |
| User stats format | Table with 3 columns | Text lines: "User X: N total entries (M today)" |
| Section spacing | `space-y-2` (8px) | `space-y-4` (16px) |




## Revert User Stats to Tabular Format

### Overview
Change the user stats section back from textual format to the previous table format with columns for User, Total Entries, and Today.

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Replace textual format with table (lines 70-81)

Current (textual):
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

New (tabular):
```tsx
{userStats && userStats.length > 0 ? (
  <table className="w-auto text-xs">
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

---

### What stays the same
- Section order (Stats → Users → Dates) - keeping users above the date table
- Increased spacing between sections (`space-y-4`)

---

### Summary

| Aspect | Current | After |
|--------|---------|-------|
| User stats format | Text lines | 3-column table |
| Section position | Above dates | Above dates (unchanged) |
| Section spacing | `space-y-4` | `space-y-4` (unchanged) |




## Add User Display Names to Admin Table

### Goal

Display friendly names alongside user numbers in the admin table (e.g., "User 1 (KC)").

### User Mapping

| User # | Display Name |
|--------|-------------|
| 1 | KC |
| 2 | Jared |
| 3 | Kristy |
| 4 | Elisabetta1 |
| 5 | Elisabetta2 |
| 6 | test |
| 8 | test2 |
| 9 | Malcolm |
| 10 | Jenny |

### Implementation

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add name mapping and update table cell display |

### Code Changes

1. Add a mapping object at the top of the component:

```tsx
const USER_NAMES: Record<number, string> = {
  1: "KC",
  2: "Jared",
  3: "Kristy",
  4: "Elisabetta1",
  5: "Elisabetta2",
  6: "test",
  8: "test2",
  9: "Malcolm",
  10: "Jenny",
};
```

2. Update the table cell rendering (around line 76):

```tsx
// Before
<td className="py-0.5 pr-2">User {user.user_number}</td>

// After
<td className="py-0.5 pr-2">
  User {user.user_number}
  {USER_NAMES[user.user_number] && ` (${USER_NAMES[user.user_number]})`}
</td>
```

### Result

The table will display:
- "User 1 (KC)"
- "User 2 (Jared)"
- "User 3 (Kristy)"
- etc.

Users without a mapped name will just show "User X" as before.


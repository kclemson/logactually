

## Dim Zero Values in Admin Tables

### Overview
Add conditional styling to display zero values in a darker gray color (`text-muted-foreground`) so they're less prominent than non-zero values, while still remaining legible.

---

### Changes to `src/pages/Admin.tsx`

#### 1. User Stats Table - Numeric Columns
Apply `text-muted-foreground` class when value is 0 for these cells:

| Column | Line | Current | Change |
|--------|------|---------|--------|
| F2day (entries_today) | 116-118 | Has green highlight for >0 | Add `text-muted-foreground` when 0 |
| W2day (weight_today) | 119-121 | Has green highlight for >0 | Add `text-muted-foreground` when 0 |
| Fs (total_entries) | 122 | No conditional styling | Add `text-muted-foreground` when 0 |
| SF (saved_meals_count) | 123 | No conditional styling | Add `text-muted-foreground` when 0 |
| Ws (total_weight_entries) | 124 | No conditional styling | Add `text-muted-foreground` when 0 |
| SW (saved_routines_count) | 125 | No conditional styling | Add `text-muted-foreground` when 0 |
| Logins (login_count) | 126 | No conditional styling | Add `text-muted-foreground` when 0 |

**Example change for line 122:**
```tsx
// From:
<td className="text-center py-0.5 pr-2">{user.total_entries}</td>

// To:
<td className={`text-center py-0.5 pr-2 ${user.total_entries === 0 ? "text-muted-foreground" : ""}`}>{user.total_entries}</td>
```

#### 2. Daily Stats Table - Numeric Columns
Apply same treatment for:

| Column | Line | Field |
|--------|------|-------|
| Food Logged | 152 | `row.entry_count` |
| Weight Logged | 153 | `row.weight_count` |
| Users w/Logged Items | 155 | `row.users_with_entries` |
| New Users | 156 | `row.users_created` |

**Note:** "Users" column (total_users) probably shouldn't dim since it's cumulative and unlikely to be 0.

**Example change for line 152:**
```tsx
// From:
<td className="text-center py-0.5 pr-2">{row.entry_count}</td>

// To:
<td className={`text-center py-0.5 pr-2 ${row.entry_count === 0 ? "text-muted-foreground" : ""}`}>{row.entry_count}</td>
```

---

### Summary

- Zero values get `text-muted-foreground` (darker gray)
- Non-zero values remain default text color (white/light in dark mode)
- Existing green highlighting for today's activity is preserved
- All values remain legible, just less prominent when zero


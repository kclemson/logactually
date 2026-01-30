

## Fix Admin Table for Mobile Layout

### Overview

Shorten column headers and reorder columns so the user stats table fits on mobile screens while keeping the new Logins column visible.

---

### Column Changes

| Current Header | New Header | Notes |
|----------------|------------|-------|
| Food Logged | Fs | Total food entries |
| Weight Logged | Ws | Total weight entries |
| Food Today | Ftod | Today's food count |
| Weight Today | Wtod | Today's weight count |
| Last Active | Last | Last activity date |
| SM | SM | No change |
| SR | SR | No change |
| Logins | Logins | No change |

---

### New Column Order

```text
User | Last | Ftod | Wtod | Fs | SM | Ws | SR | Logins
```

This groups "today" metrics together and places frequently-checked columns (Last, Ftod, Wtod) earlier.

---

### File Changes

**`src/pages/Admin.tsx`**

Update the user stats table headers and data cells:

**Headers (lines 89-98):**
```tsx
<th className="text-left py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">User</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Last</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Ftod</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Wtod</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Fs</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">SM</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">Ws</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground">SR</th>
<th className="text-center py-0.5 font-medium text-muted-foreground">Logins</th>
```

**Data cells (lines 103-129) - reordered to match:**
```tsx
{/* User */}
<td className={...}>{USER_NAMES[user.user_number] ?? `User ${user.user_number}`}</td>
{/* Last */}
<td className={...}>{user.last_active ? format(parseISO(user.last_active), "MMM d") : "—"}</td>
{/* Ftod */}
<td className={...}>{user.entries_today}</td>
{/* Wtod */}
<td className={...}>{user.weight_today ?? 0}</td>
{/* Fs */}
<td className="text-center py-0.5 pr-2">{user.total_entries}</td>
{/* SM */}
<td className="text-center py-0.5 pr-2">{user.saved_meals_count ?? 0}</td>
{/* Ws */}
<td className="text-center py-0.5 pr-2">{user.total_weight_entries ?? 0}</td>
{/* SR */}
<td className="text-center py-0.5 pr-2">{user.saved_routines_count ?? 0}</td>
{/* Logins */}
<td className="text-center py-0.5">{user.login_count ?? 0}</td>
```

---

### Summary

| Change | Details |
|--------|---------|
| Shorten headers | Food Logged→Fs, Weight Logged→Ws, Food Today→Ftod, Weight Today→Wtod, Last Active→Last |
| Reorder columns | User, Last, Ftod, Wtod, Fs, SM, Ws, SR, Logins |
| No logic changes | Same data, same highlighting rules, just repositioned |


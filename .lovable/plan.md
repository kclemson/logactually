

## Add Green Highlighting for Active User Rows

Add conditional green text coloring to "Food Today", "Weight Today" columns when values are greater than 0, and highlight the username if any activity occurred today.

---

### Changes

**File: `src/pages/Admin.tsx`**

Update three cells in the user stats table to conditionally apply green text:

```tsx
// Line 97: Username - green if any activity today
<td className={`py-0.5 pr-2 whitespace-nowrap ${
  user.entries_today > 0 || 
  (user.weight_today ?? 0) > 0 || 
  (user.last_active && isToday(parseISO(user.last_active))) 
    ? "text-green-500" : ""
}`}>
  User {user.user_number}
  {USER_NAMES[user.user_number] && ` (${USER_NAMES[user.user_number]})`}
</td>

// Line 102: Food Today - green if > 0
<td className={`text-center py-0.5 pr-2 ${user.entries_today > 0 ? "text-green-500" : ""}`}>
  {user.entries_today}
</td>

// Line 104: Weight Today - green if > 0
<td className={`text-center py-0.5 pr-2 ${(user.weight_today ?? 0) > 0 ? "text-green-500" : ""}`}>
  {user.weight_today ?? 0}
</td>
```

---

### Logic Summary

| Column | Condition for Green |
|--------|---------------------|
| User | `entries_today > 0` OR `weight_today > 0` OR `last_active is today` |
| Food Today | `entries_today > 0` |
| Weight Today | `weight_today > 0` |
| Last Active | `last_active is today` (already implemented) |

---

### Files Summary

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add conditional `text-green-500` to Username (line 97), Food Today (line 102), and Weight Today (line 104) cells |


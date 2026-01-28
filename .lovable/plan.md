

## Prevent User Column from Wrapping

Add `whitespace-nowrap` to the User column to prevent long usernames from wrapping to multiple lines.

---

### Problem

Names like "User 4 (Elisabetta1)" and "User 5 (Elisabetta2)" wrap to two lines because the column has no constraint preventing text wrap.

---

### Solution

Add `whitespace-nowrap` class to both the header and data cells of the User column. This is simpler and more robust than setting a fixed min-width since it adapts to any username length.

**File: `src/pages/Admin.tsx`**

```tsx
// Line 86: Add whitespace-nowrap to header
<th className="text-left py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">User</th>

// Line 97: Add whitespace-nowrap to data cell
<td className="py-0.5 pr-2 whitespace-nowrap">
```

---

### Why This Works

- `whitespace-nowrap` prevents the text from breaking to a new line
- The table uses `w-auto` which allows columns to shrink/grow naturally
- The numeric columns (Food Logged, Weight Logged, etc.) will compress slightly to accommodate the wider User column
- This approach is self-adjusting—it works for any username length

---

### Files Summary

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add `whitespace-nowrap` to User column header (line 86) and data cells (line 97) |


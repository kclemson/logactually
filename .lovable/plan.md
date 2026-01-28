
## Color "Last Active" Green When Today

Add conditional green text color to the "Last Active" column when the date matches the current day.

---

### Change

**File: `src/pages/Admin.tsx`**

Lines 105-107 - Add `isToday` import and conditional styling:

```tsx
// Line 4: Add isToday import
import { format, parseISO, isToday } from "date-fns";

// Lines 105-107: Add conditional green color
<td className={`text-center py-0.5 ${user.last_active && isToday(parseISO(user.last_active)) ? "text-green-500" : ""}`}>
  {user.last_active ? format(parseISO(user.last_active), "MMM d") : "—"}
</td>
```

---

### How It Works

1. Import `isToday` from `date-fns` (already using this library)
2. Parse the `last_active` timestamp and check if it matches today's date
3. If true, apply `text-green-500` class for green text
4. Otherwise, use default text color

---

### Files Summary

| File | Change |
|------|--------|
| `src/pages/Admin.tsx` | Add `isToday` import (line 4), add conditional green color to Last Active cell (lines 105-107) |

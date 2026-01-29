
## Prevent Date Column Text Wrapping in Admin Page

### Problem
The Date column in the daily stats table wraps "Jan-28" to two lines ("Jan-" / "28") on narrow screens.

### Solution
Add `whitespace-nowrap` class to the date cell to prevent text wrapping.

---

### Implementation

**File:** `src/pages/Admin.tsx`

**Line 146** - Add `whitespace-nowrap` to the date cell:

```tsx
// Before
<td className="py-0.5 pr-2">{format(parseISO(row.stat_date), "MMM-dd")}</td>

// After
<td className="py-0.5 pr-2 whitespace-nowrap">{format(parseISO(row.stat_date), "MMM-dd")}</td>
```

---

### What Stays the Same
- Date format remains `"MMM-dd"` (e.g., "Jan-28")
- Column header "Date" unchanged
- All other styling unchanged

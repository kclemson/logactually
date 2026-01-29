

## Fix Admin Daily Stats Table Row Wrapping

### Problem
The daily stats table headers and date column are wrapping to multiple lines, making each row taller than necessary. The headers like "Users w/Logged Items" and dates like "Jan-28" are breaking.

### Options to Fix

**Option 1: Add `whitespace-nowrap` to prevent wrapping (Simplest)**
- Add `whitespace-nowrap` to the Date column cells and headers
- This prevents text from wrapping but may cause horizontal overflow on very narrow screens

**Option 2: Abbreviate header text (More compact)**
- Shorten "Users w/Logged Items" → "w/Items" or "Active"
- Shorten "Weight Logged" → "Weight"
- Shorten "Food Logged" → "Food"
- Change date format from "MMM-dd" to "M/d" (1/28 instead of Jan-28)

**Option 3: Combine both approaches (Recommended)**
- Add `whitespace-nowrap` to all cells in the daily stats table
- Abbreviate header labels to be more compact
- Use shorter date format

---

### Recommended Implementation

**File:** `src/pages/Admin.tsx`

**1. Abbreviate headers and add nowrap (lines 134-141)**

| Current | New |
|---------|-----|
| `Date` | `Date` (add `whitespace-nowrap`) |
| `Food Logged` | `Food` |
| `Weight Logged` | `Wt` |
| `Users` | `Users` |
| `Users w/Logged Items` | `Active` |
| `New Users` | `New` |

**2. Change date format and add nowrap to cells (line 146)**

```tsx
// Before
<td className="py-0.5 pr-2">{format(parseISO(row.stat_date), "MMM-dd")}</td>

// After  
<td className="py-0.5 pr-2 whitespace-nowrap">{format(parseISO(row.stat_date), "M/d")}</td>
```

**3. Add nowrap to all header cells**

```tsx
<th className="text-left py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">Date</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">Food</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">Wt</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">Users</th>
<th className="text-center py-0.5 pr-2 font-medium text-muted-foreground whitespace-nowrap">Active</th>
<th className="text-center py-0.5 font-medium text-muted-foreground whitespace-nowrap">New</th>
```

---

### Result

The table will have single-line rows with compact headers:

| Date | Food | Wt | Users | Active | New |
|------|------|----|-------|--------|-----|
| 1/28 | 19   | 10 | 6     | 6      | 0   |
| 1/27 | 35   | 4  | 6     | 6      | 2   |

---

### Files to Modify

- `src/pages/Admin.tsx` (lines 134-146)


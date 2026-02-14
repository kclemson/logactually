

## Fix "Last" Column Wrapping in Admin Table

### Problem
The "Last" column (showing dates like "Feb 14") wraps to two lines because there isn't enough horizontal space.

### Solution
Combine two small changes to reclaim enough width:

1. **Shorten header labels**: Rename `F2day` to `F2d` and `W2day` to `W2d` (saves ~6 characters of width)
2. **Reduce inter-column padding**: Change `pr-2` to `pr-1` on the numeric data columns (F, SF, W, SW, C, Cs, Logins, L2day) where the values are small numbers and don't need as much spacing

### Technical details

**File: `src/pages/Admin.tsx`**

- **Line 139**: Change header text `F2day` to `F2d`
- **Line 140**: Change header text `W2day` to `W2d`
- **Lines 141-146** (headers for F, SF, W, SW, C, Cs): Change `pr-2` to `pr-1`
- **Lines 253-311** (data cells for F, SF, W, SW, C, Cs): Change `pr-2` to `pr-1`
- **Lines 313-325** (Logins, L2day cells): Change `pr-2` to `pr-1`

The User and Last columns keep `pr-2` since they contain wider text content. The "today" columns (F2d, W2d) also keep `pr-2` since they're the first numeric columns and benefit from separation from the Last column.


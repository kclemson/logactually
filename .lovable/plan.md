

## Fix inconsistent calories styling between collapsed and expanded group headers

### Problem
The collapsed group header calories cell (line 403) is missing the `text-heading` class that the expanded header (line 581) has. This causes the font size to differ between states — collapsed uses the default (smaller) size while expanded gets `text-heading` (14px, bold-weight appearance).

### Change — `src/components/FoodItemsTable.tsx`

**Line 403** — Add `text-heading` to the collapsed group header calories cell to match the expanded header (line 581):

```
// Before (line 403):
<span className={cn("px-1 py-1 text-center", compact ? "text-xs" : "")}>

// After:
<span className={cn("px-1 py-1 text-center", compact ? "text-xs" : "text-heading")}>
```

Single line change. Both collapsed and expanded group headers will now render calories identically.


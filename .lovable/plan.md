

# Use compact date format in admin feedback header

## Change

In `src/pages/Admin.tsx`, change the date format from `"MMM d, yyyy"` to `"MMM d"` (dropping the year and comma) in both the active and resolved feedback sections.

### Lines to update
- **Line 418**: `format(parseISO(f.created_at), "MMM d, yyyy")` → `format(parseISO(f.created_at), "MMM d")`
- **Line 538**: `format(parseISO(f.created_at), "MMM d, yyyy")` → `format(parseISO(f.created_at), "MMM d")`

This keeps the header row more compact so the feedback ID, date, user number, status, and action links all fit on one line.


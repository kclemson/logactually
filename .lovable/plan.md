
## Adjust Grid Column Widths for Admin Stats

### Overview
Change the stats grid from equal-width columns (`grid-cols-3`) to auto-fitting columns where the Users column gets more space since it has longer text (percentages).

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Change: Use custom grid template instead of `grid-cols-3`

Current (lines 47 and 54):
```tsx
<div className="grid grid-cols-3 gap-1 text-muted-foreground text-xs">
```

New:
```tsx
<div className="grid grid-cols-[auto_auto_auto] gap-1 text-muted-foreground text-xs">
```

Using `grid-cols-[auto_auto_auto]` makes each column shrink to fit its content rather than dividing space equally. This allows:
- Users column to expand for the longer percentage text
- Entries and Saved Meals columns to stay compact since they have shorter values

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| Grid column sizing | `grid-cols-3` (equal 1/3 each) | `grid-cols-[auto_auto_auto]` (content-based) |
| Users column | Constrained to 1/3 width | Expands to fit "Created RL7: 5 (100%)" |
| Other columns | 1/3 each | Shrink to fit content |

---

### Result
- Each column auto-sizes to its content
- Users column gets more space naturally due to percentage text
- No text wrapping on the sub-stats

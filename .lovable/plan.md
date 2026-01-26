

## Reduce Chart Widget Padding

### Overview
Minimize the internal padding on all four sides of each chart card to create a more compact, information-dense layout.

---

### Changes

**File: `src/pages/Trends.tsx`**

#### Current Padding Structure
- `CardHeader`: Default `p-6` from Card component, with only `pb-2` override (so it still has 24px on other sides)
- `CardContent`: `p-3 pt-0` (12px sides/bottom, 0 top)

#### New Padding Structure
- `CardHeader`: Add `p-2 pb-1` to reduce all header padding (8px, then 4px bottom)
- `CardContent`: Change from `p-3 pt-0` to `p-2 pt-0` (8px sides/bottom, 0 top)

---

### Specific Updates

| Line | Location | Current | New |
|------|----------|---------|-----|
| 164 | Calories CardHeader | `className="pb-2"` | `className="p-2 pb-1"` |
| 167 | Calories CardContent | `className="p-3 pt-0"` | `className="p-2 pt-0"` |
| 199 | Macros CardHeader | `className="pb-2"` | `className="p-2 pb-1"` |
| 202 | Macros CardContent | `className="p-3 pt-0"` | `className="p-2 pt-0"` |
| 246 | Row 2 charts CardHeader | `className="pb-2"` | `className="p-2 pb-1"` |
| 249 | Row 2 charts CardContent | `className="p-3 pt-0"` | `className="p-2 pt-0"` |

---

### Result
- All chart cards will have tighter padding (8px instead of 24px on header, 8px instead of 12px on content)
- More chart area visible within each card
- Consistent compact styling across all 5 chart widgets
- Maintains the minimalist, high-density aesthetic


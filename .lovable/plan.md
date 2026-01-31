

## Cap Duration Labels to Prevent Long Decimals

### Problem

After enabling fractional duration storage, the chart labels and tooltips now display raw decimal values like `20.1166666666666667` instead of clean numbers.

### Solution

Format `duration_minutes` values to 1 decimal place for labels/tooltips. This keeps precision visible (useful for speed calculations) while staying concise.

---

### Changes

**File: `src/pages/Trends.tsx`**

| Location | Current | Updated |
|----------|---------|---------|
| Line 138 (bar label) | `${d.duration_minutes \|\| 0}` | `${Number(d.duration_minutes \|\| 0).toFixed(1)}` |
| Line 259 (tooltip duration) | `const duration = entry.payload.duration_minutes \|\| 0` | `const duration = Number(entry.payload.duration_minutes \|\| 0).toFixed(1)` |

---

### Result

| Before | After |
|--------|-------|
| `20.1166666666666667` | `20.1` |
| `11.5` | `11.5` |
| `12` | `12.0` |

---

### Alternative Considered

Converting to `mm:ss` format (e.g., `11:30` instead of `11.5`) was considered but would require a utility function and adds visual complexity. Single decimal place is simpler and matches the mph display pattern already in use.


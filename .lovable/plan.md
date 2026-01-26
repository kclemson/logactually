

## Remove Spaces Around Slashes in P/C/F Display

### Overview
Remove the spaces around the `/` separators in the Protein/Carbs/Fat column to save ~15-20px of horizontal space, which should prevent wrapping without changing column widths.

**Before:** `116 / 158 / 94`  
**After:** `116/158/94`

---

### Changes to `src/components/FoodItemsTable.tsx`

| Location | Line | Before | After |
|----------|------|--------|-------|
| Totals row | 237 | `{Math.round(totals.protein)} / {Math.round(totals.carbs)} / {Math.round(totals.fat)}` | `{Math.round(totals.protein)}/{Math.round(totals.carbs)}/{Math.round(totals.fat)}` |
| Preview macros | 436 | `` `${previewMacros.protein} / ${previewMacros.carbs} / ${previewMacros.fat}` `` | `` `${previewMacros.protein}/${previewMacros.carbs}/${previewMacros.fat}` `` |
| Editable rows | 437 | `` `${Math.round(item.protein)} / ${Math.round(item.carbs)} / ${Math.round(item.fat)}` `` | `` `${Math.round(item.protein)}/${Math.round(item.carbs)}/${Math.round(item.fat)}` `` |
| Non-editable rows | 445 | `{Math.round(item.protein)} / {Math.round(item.carbs)} / {Math.round(item.fat)}` | `{Math.round(item.protein)}/{Math.round(item.carbs)}/{Math.round(item.fat)}` |

---

### Visual Comparison

```text
Before (90px column):        After (90px column):
+------------------+         +------------------+
| 116 / 158 / 94   |  →      | 116/158/94       |
| (wraps to 2      |         | (fits on 1 line) |
|  lines)          |         |                  |
+------------------+         +------------------+
```

---

### Files Changed

| File | Action |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Remove spaces around `/` in 4 locations |


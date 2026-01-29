

## Move Column Headers Below Total Row in FoodItemsTable

### Overview

Reorder the FoodItemsTable layout to match WeightItemsTable, where the column headers appear directly above the data rows (below the totals row) rather than above the totals.

---

### Current vs. Desired Layout

| Current (Food) | Desired (Food) | WeightItemsTable |
|----------------|----------------|------------------|
| Headers | **Totals** | Totals |
| Totals | **Headers** | Headers |
| Data rows | **Data rows** | Data rows |

---

### File to Modify

**`src/components/FoodItemsTable.tsx`**

---

### Change

Swap the order of the header row and top-positioned totals row (lines 359-380):

```typescript
// Before (current order):
{/* Header row */}
{showHeader && (
  <div className={...}>...</div>
)}

{/* Mini header when main header is hidden but labels requested */}
{!showHeader && showInlineLabels && items.length > 0 && (
  <div className={...}>...</div>
)}

{/* Totals at top */}
{showTotals && totalsPosition === 'top' && <TotalsRow />}

{/* Data rows */}
{items.map(...)}


// After (new order matching WeightItemsTable):
{/* Totals at top */}
{showTotals && totalsPosition === 'top' && <TotalsRow />}

{/* Header row */}
{showHeader && (
  <div className={...}>...</div>
)}

{/* Mini header when main header is hidden but labels requested */}
{!showHeader && showInlineLabels && items.length > 0 && (
  <div className={...}>...</div>
)}

{/* Data rows */}
{items.map(...)}
```

---

### Result

The FoodItemsTable will now display:
1. **Total row** (highlighted bar with aggregated values)
2. **Column headers** (Calories, Protein/Carbs/Fat labels)
3. **Data rows** (individual food items)

This matches the WeightItemsTable layout the user prefers.

---

### Summary

- 1 file modified
- Reordering of 3 JSX blocks (no content changes)
- No functional changes, purely visual layout adjustment


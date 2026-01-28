

## Hide Totals Row in Saved Routines Section

The expanded saved routines are showing a "Total" row which shouldn't appear. The issue is that `WeightItemsTable` doesn't have a `showTotals` prop like `FoodItemsTable` does.

---

### Root Cause

- `FoodItemsTable` has `showTotals` prop (defaults to `true`) that controls totals visibility
- `WeightItemsTable` always shows totals when `items.length > 0` with no way to hide them
- `SavedRoutineRow` passes `showHeader={false}` but can't hide totals

---

### Changes

**File: `src/components/WeightItemsTable.tsx`**

Add `showTotals` prop to match `FoodItemsTable` pattern:

1. Add prop to interface (around line 44):
```tsx
showTotals?: boolean;
```

2. Add to destructured props with default true (around line 62):
```tsx
showTotals = true,
```

3. Wrap totals rendering with condition (line 233):
```tsx
{showTotals && items.length > 0 && totalsPosition === 'top' && <TotalsRow />}
```

**File: `src/components/SavedRoutineRow.tsx`**

Pass `showTotals={false}` to `WeightItemsTable` (line 177-183):
```tsx
<WeightItemsTable
  items={localItems}
  editable={true}
  showHeader={false}
  showTotals={false}
  onUpdateItem={handleUpdateItem}
  onRemoveItem={handleRemoveItem}
/>
```

---

### Files Summary

| File | Change |
|------|--------|
| `src/components/WeightItemsTable.tsx` | Add `showTotals` prop (default `true`) and use it in render condition |
| `src/components/SavedRoutineRow.tsx` | Pass `showTotals={false}` to hide totals in expanded view |


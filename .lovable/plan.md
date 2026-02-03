

## Simplify SimilarMealPrompt Food Items Preview

### Problem

The food items preview has too many visual dividers:
1. A border/box around the entire list
2. A line above the "Total" row

This creates unnecessary visual noise for a simple preview.

---

### Changes Overview

1. **Remove the border wrapper** around `FoodItemsTable` in `SimilarMealPrompt`
2. **Add a prop to hide the totals divider line** in `FoodItemsTable`

---

### Visual Change

**Before:**
```
┌──────────────────────────────────────────────────────┐
│  Vanilla Yogurt (1 container (4 oz))     90   4/16/2│
│  Sliced Strawberries (1 cup)             53   1/13/0│
├──────────────────────────────────────────────────────┤
│  Total                                  143   5/29/2│
└──────────────────────────────────────────────────────┘
```

**After:**
```
  Vanilla Yogurt (1 container (4 oz))     90   4/16/2
  Sliced Strawberries (1 cup)             53   1/13/0
  Total                                  143   5/29/2
```

No box, no divider line—just clean rows flowing into totals.

---

### Technical Changes

**File: `src/components/FoodItemsTable.tsx`**

| Change | Description |
|--------|-------------|
| Add `showTotalsDivider` prop | New optional prop, default `true` |
| Update TotalsRow styling | Only apply `border-t-2` when `showTotalsDivider` is true |

**File: `src/components/SimilarMealPrompt.tsx`**

| Change | Description |
|--------|-------------|
| Remove wrapper div border | Remove `border rounded-md` and `bg-background/50` classes |
| Pass `showTotalsDivider={false}` | Disable the line above totals |

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `showTotalsDivider` prop |
| `src/components/SimilarMealPrompt.tsx` | Remove border, pass `showTotalsDivider={false}` |


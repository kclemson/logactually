

## Enhance SimilarMealPrompt with Match Label and Food Items Preview

### Changes Overview

1. **Add "match" back** to the percentage display - e.g., "(80% match)"
2. **Show food items** from the saved meal in a non-editable preview using `FoodItemsTable`

---

### Updated Component UI

**Current:**
```
                                                    [X]
Looks like your saved meal: "Yogurt + strawberries" (80%)
[ Use Saved Meal ] [ Dismiss ]
```

**After:**
```
                                                    [X]
Looks like your saved meal: "Yogurt + strawberries" (80% match)

┌──────────────────────────────────────────────────────┐
│  Vanilla Yogurt (1 container (4 oz))     90   4/16/2│
│  Sliced Strawberries (1 cup)             53   1/13/0│
└──────────────────────────────────────────────────────┘

[ Use Saved Meal ] [ Dismiss ]
```

---

### Technical Changes

**File: `src/components/SimilarMealPrompt.tsx`**

| Change | Description |
|--------|-------------|
| Add "match" to percentage | Change `({matchPercent}%)` to `({matchPercent}% match)` |
| Import `FoodItemsTable` | Add import for the table component |
| Import `useMemo` | For generating UIDs for items |
| Add food items preview | Render `FoodItemsTable` with `editable={false}` |
| Configure table props | `showHeader={false}`, `showTotals={true}`, `totalsPosition="bottom"`, `showInlineLabels={true}` |

---

### FoodItemsTable Configuration for Preview

The table will be configured for a compact, read-only preview:

```tsx
<FoodItemsTable
  items={itemsWithUids}
  editable={false}
  showHeader={false}
  showTotals={true}
  totalsPosition="bottom"
  showInlineLabels={true}
  showMacroPercentages={false}
/>
```

This matches the Settings pattern but with:
- `editable={false}` - No editing allowed
- `showTotals={true}` - Show totals row so user can see the full meal value
- `showMacroPercentages={false}` - Keep it compact

---

### Item UID Generation

Similar to `SavedMealRow`, we need to add temporary UIDs for React keys:

```tsx
const itemsWithUids = useMemo(() => 
  match.meal.food_items.map((item, idx) => ({
    ...item,
    uid: `similar-preview-${idx}`,
  })),
  [match.meal.food_items]
);
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/SimilarMealPrompt.tsx` | Add "match" text, import and render FoodItemsTable preview |


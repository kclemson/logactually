

## Increase Indentation for Expanded Saved Meal/Routine Items

The expanded item rows in saved meals and saved routines need more visual indentation to create a clearer parent-child hierarchy.

---

### Current State

Both `SavedMealRow.tsx` and `SavedRoutineRow.tsx` have `pl-6` (24px) on the expanded table container:
```tsx
<div className="pl-6 mt-1">
  <FoodItemsTable ... />
</div>
```

However, the visual hierarchy isn't clear enough because:
1. The chevron takes up space (~20px including padding)
2. The item rows start immediately after the 24px padding
3. Result: items appear roughly aligned with the parent name

---

### Solution

Increase the left padding from `pl-6` (24px) to `pl-8` (32px) or `pl-10` (40px) to create more noticeable indentation that clearly shows the items are nested under the parent row.

---

### Changes

| File | Line | Change |
|------|------|--------|
| `src/components/SavedMealRow.tsx` | 182 | Change `pl-6` to `pl-8` |
| `src/components/SavedRoutineRow.tsx` | 173 | Change `pl-6` to `pl-8` |

---

### Visual Result

```text
Before (pl-6 = 24px):
  > Yogurt+strawberries        2 items  [trash]
    Vanilla Yogurt               90     4/16/2

After (pl-8 = 32px):
  > Yogurt+strawberries        2 items  [trash]
      Vanilla Yogurt             90     4/16/2
```

The extra 8px of indentation will make the nested relationship more visually apparent.


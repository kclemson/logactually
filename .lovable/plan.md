

## Reduce Indentation for Saved Meals/Routines Parent Rows

The parent saved meal/routine rows are currently indented too much from the section header due to padding being applied at multiple levels.

---

### Current Indentation Chain

1. `CollapsibleSection.tsx` line 77: Content has `pl-4` (16px)
2. `SavedMealRow` parent row: No additional padding, but chevron takes ~20px
3. `SavedMealRow` expanded items: `pl-8` (32px) relative to parent

Result: Parent rows start 16px from header, child items start 48px from header. This feels too nested.

---

### Solution

**Remove** the `pl-4` from CollapsibleSection's children container. This brings parent rows closer to the section header, and the chevron icon provides natural visual hierarchy.

Then **reduce** the expanded items padding from `pl-8` to `pl-6` to maintain a subtle but clear parent-child relationship.

---

### Changes

| File | Line | Change |
|------|------|--------|
| `src/components/CollapsibleSection.tsx` | 77 | Remove `pl-4` from children container |
| `src/components/SavedMealRow.tsx` | 182 | Change `pl-8` to `pl-6` |
| `src/components/SavedRoutineRow.tsx` | 173 | Change `pl-8` to `pl-6` |

---

### Visual Result

```text
Before:
    ☆ Saved Meals ∨                    + Add
        > Yogurt+strawberries          2 items  [trash]
            Vanilla Yogurt             90     4/16/2

After:
☆ Saved Meals ∨                        + Add
> Yogurt+strawberries                  2 items  [trash]
    Vanilla Yogurt                     90     4/16/2
```

Parent rows now start at the left edge (aligned with the section chevron), and child items have a moderate indent that clearly shows nesting.

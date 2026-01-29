

## Implement Save-on-Blur for Inline Editing

### Overview

Change inline editing behavior so that **blur saves the value** (instead of reverting), with validation to prevent saving empty or zero values. This makes the iOS Safari keyboard checkmark button work as users expect.

---

### Behavior Summary

| Action | Current Behavior | New Behavior |
|--------|------------------|--------------|
| **Enter** | Save and close | Save and close (unchanged) |
| **Escape** | Revert and close | Revert and close (unchanged) |
| **Blur** (tap away / iOS checkmark) | **Revert** | **Save if valid, else revert** |

**Validation rules:**
- **Description fields**: Save unless empty/whitespace-only
- **Number fields**: Save unless 0 or empty (for calories, sets, reps, weight)

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/FoodItemsTable.tsx` | Update `onBlur` for calories input and `handleDescriptionBlur` |
| `src/components/WeightItemsTable.tsx` | Update `onBlur` for sets/reps/weight inputs and `handleDescriptionBlur` |
| `src/components/SavedMealRow.tsx` | Update meal name `contentEditable` blur handler |
| `src/components/SavedRoutineRow.tsx` | Update routine name `contentEditable` blur handler |

---

### Implementation Details

#### 1. FoodItemsTable - Calories Input

```typescript
// Current onBlur (line ~520):
onBlur={() => setEditingCell(null)}

// New onBlur:
onBlur={() => {
  if (editingCell && editingCell.value !== editingCell.originalValue) {
    const numValue = Number(editingCell.value);
    // Only save if non-zero and valid
    if (numValue > 0) {
      // Same batch logic as Enter key for calories
      const item = items[index];
      const scaled = scaleMacrosByCalories(
        item.calories, item.protein, item.carbs, item.fat, numValue
      );
      onUpdateItemBatch?.(index, {
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
      });
    }
  }
  setEditingCell(null);
}}
```

#### 2. FoodItemsTable - Description (contentEditable)

```typescript
// Current handleDescriptionBlur (line ~186-189):
const handleDescriptionBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
  e.currentTarget.textContent = descriptionOriginalRef.current;
};

// New handleDescriptionBlur:
const handleDescriptionBlur = (
  e: React.FocusEvent<HTMLSpanElement>,
  index: number,
  item: FoodItem
) => {
  if (isReadOnly) {
    e.currentTarget.textContent = descriptionOriginalRef.current;
    return;
  }
  
  const newDescription = (e.currentTarget.textContent || '').trim();
  
  // Revert if empty, otherwise save
  if (!newDescription) {
    e.currentTarget.textContent = descriptionOriginalRef.current;
  } else if (newDescription !== descriptionOriginalRef.current) {
    onUpdateItem?.(index, 'description', newDescription);
    if (item.portion) {
      onUpdateItem?.(index, 'portion', '');
    }
  }
};
```

#### 3. WeightItemsTable - Number Inputs (sets, reps, weight)

```typescript
// Current onBlur (lines ~402, 432, 475):
onBlur={() => setEditingCell(null)}

// New onBlur pattern:
onBlur={() => {
  if (editingCell && editingCell.value !== editingCell.originalValue) {
    const numValue = Number(editingCell.value);
    // Save if positive (non-zero)
    if (numValue > 0) {
      onUpdateItem?.(index, field, editingCell.value);
    }
  }
  setEditingCell(null);
}}
```

#### 4. WeightItemsTable - Description (contentEditable)

Same pattern as FoodItemsTable - save on blur unless empty.

#### 5. SavedMealRow - Meal Name (contentEditable)

```typescript
// Current onBlur (line ~76):
onBlur={(e) => {
  e.currentTarget.textContent = e.currentTarget.dataset.original || meal.name;
}}

// New onBlur:
onBlur={(e) => {
  const newName = (e.currentTarget.textContent || '').trim();
  const original = e.currentTarget.dataset.original || meal.name;
  
  if (!newName) {
    // Revert if empty
    e.currentTarget.textContent = original;
  } else if (newName !== original) {
    // Save valid name
    onUpdateMeal({ id: meal.id, name: newName });
    e.currentTarget.dataset.original = newName;
  }
}}
```

#### 6. SavedRoutineRow - Routine Name (contentEditable)

Same pattern as SavedMealRow.

---

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| User clears description and blurs | Reverts to original |
| User sets calories to 0 and blurs | Reverts to original |
| User edits to same value and blurs | No-op (no save triggered) |
| Read-only mode user blurs | Always reverts |
| User presses Escape then blurs | Already reverted, blur is no-op |

---

### Summary of Changes

- 4 files modified
- ~15-20 lines changed per file
- No new dependencies
- Consistent behavior across all inline editing in the app


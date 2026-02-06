

## Plan: Smarter Item Ordering in Save Dialogs

### Problem
When the user clicks "Save as meal" on item 6 of 12, the dialog shows items in chronological entry order. If entry 5 was a 4-item coffee saved meal, all 4 coffee items appear immediately after the selected item - which feels off and clutters the view.

### Proposed Ordering Strategy

**Priority-based ordering for "other" items (items not from the clicked entry):**

1. **First**: Items from entries that are NOT from a saved meal (`source_meal_id === null`)
2. **Then**: Items from entries that ARE from a saved meal
3. **Within each group**: Order by proximity to clicked entry (items logged just before, then just after)

This ensures:
- Manual entries (more likely to be unique/related) appear first
- Saved meal entries (repetitive, like daily coffee) are pushed down
- The "Show N more" hides the less relevant items

### Technical Changes

#### 1. Extend `OtherFoodEntry` interface (SaveMealDialog.tsx)

Add `isFromSavedMeal` flag so the dialog can use it for ordering:

```tsx
interface OtherFoodEntry {
  entryId: string;
  items: FoodItem[];
  rawInput: string | null;
  isFromSavedMeal: boolean;  // NEW: true if source_meal_id is set
}
```

#### 2. Update `otherEntriesForMealDialog` (FoodLog.tsx)

Pass `isFromSavedMeal` in the mapping:

```tsx
.map(e => ({
  entryId: e.id,
  items: e.food_items,
  rawInput: e.raw_input,
  isFromSavedMeal: !!e.source_meal_id,  // NEW
}));
```

#### 3. Update `allItems` computation (SaveMealDialog.tsx)

Currently:
```tsx
const allItems = useMemo(() => {
  const items = [...foodItems];  // Primary items first
  otherEntries?.forEach(entry => items.push(...entry.items));  // Then others in entry order
  return items.map((item, i) => ({ ...item, uid: `combined-${i}` }));
}, [foodItems, otherEntries]);
```

Proposed (sort other entries before flattening):
```tsx
const allItems = useMemo(() => {
  const items = [...foodItems];  // Primary items first
  
  // Sort other entries: manual entries first, then saved meal entries
  const sortedOtherEntries = [...(otherEntries ?? [])].sort((a, b) => {
    // Manual entries (not from saved meal) come first
    if (!a.isFromSavedMeal && b.isFromSavedMeal) return -1;
    if (a.isFromSavedMeal && !b.isFromSavedMeal) return 1;
    return 0;  // Keep relative order within group (already sorted by proximity in parent)
  });
  
  sortedOtherEntries.forEach(entry => items.push(...entry.items));
  return items.map((item, i) => ({ ...item, uid: `combined-${i}` }));
}, [foodItems, otherEntries]);
```

### Visual Example

**Current order (chronological):**
```
☑ Strawberries (selected - primary)
☐ Black Coffee       ← from saved meal "Morning Coffee"
☐ Whole Milk        
☐ Ground Cinnamon   
☐ Zero Sugar Whipped Cream
   Show 6 more...
```

**Proposed order (manual first):**
```
☑ Strawberries (selected - primary)
☐ Vanilla Yogurt     ← manual entry (not from saved meal)
☐ Sliced Strawberries
☐ Protein Granola Bars
☐ White Choc w/ Almonds
   Show 6 more...     ← coffee items (from saved meal) hidden here
```

### Files Modified

| File | Changes |
|------|---------|
| `src/components/SaveMealDialog.tsx` | Add `isFromSavedMeal` to interface, sort entries in `allItems` computation |
| `src/pages/FoodLog.tsx` | Pass `isFromSavedMeal: !!e.source_meal_id` in `otherEntriesForMealDialog` |

### Same Pattern for SaveRoutineDialog

Apply the same approach:
- Extend `OtherWeightEntry` with `isFromSavedRoutine`
- Pass it from `WeightLog.tsx`
- Sort in the dialog before flattening

### Benefits

- Manual/unique entries surface first (more likely to be related to current selection)
- Saved meal entries (repetitive daily patterns) are deprioritized
- No new props or complex sorting logic in shared table components
- The existing "Show N more" naturally hides the less relevant items


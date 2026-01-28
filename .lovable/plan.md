

## Inline Editing for Saved Meals & Routines in Settings

Add expand/collapse functionality to each saved meal/routine row, revealing an editable items table that reuses the existing `FoodItemsTable` and `WeightItemsTable` components with all their editing behaviors (blue focus rings, Enter-to-save, Escape-to-cancel, macro scaling).

---

### UI Changes Overview

```text
Before:
  yogurt+strawberries      2 items  [trash]

After:
  > yogurt+strawberries    2 items  [trash]
      Vanilla Yogurt (4oz)   90   4/16/2
      Sliced Strawberries    53   1/13/0
```

- Each saved item row gets a chevron toggle on the left
- When expanded, items table appears indented below with full editing
- Reduce vertical padding (`py-1` -> `py-0.5`) in saved items list for mobile compactness
- Name field remains inline-editable whether expanded or not

---

### Implementation

#### 1. New Component: `SavedMealRow.tsx`

Encapsulates a single saved meal row with:
- Chevron toggle for expand/collapse
- Editable name field (existing contentEditable pattern)
- Item count display
- Delete button with confirmation popover
- When expanded: `FoodItemsTable` with `editable={true}`, `showHeader={false}`, `showTotals={false}`

**Key logic:**
- Assign temporary `uid` to each item: `${meal.id}-item-${idx}` (not persisted)
- On item edit (Enter pressed), rebuild `food_items` array and call `updateMeal.mutate({ id, foodItems })`
- Uses existing `FoodItemsTable` callbacks: `onUpdateItem`, `onUpdateItemBatch`, `onRemoveItem`

#### 2. New Component: `SavedRoutineRow.tsx`

Same pattern for weight routines:
- Chevron toggle, editable name, exercise count, delete button
- When expanded: `WeightItemsTable` with `editable={true}`, `showHeader={false}`
- Assign temporary `uid` and `entryId` to each exercise set
- On edit, rebuild `exercise_sets` array and call `updateRoutine.mutate({ id, exerciseSets })`

#### 3. Update `Settings.tsx`

- Add expansion state: `expandedMealIds` and `expandedRoutineIds` (Set<string>)
- Reduce padding in lists: `space-y-1` -> `space-y-0`
- Replace inline meal/routine rendering with new row components
- Pass toggle handlers and mutation functions

---

### Technical Details

#### Temporary UID Generation

Since saved items don't store `uid` (stripped on save to prevent collisions), we generate temporary ones for editing:

```tsx
const itemsWithUids = useMemo(() => 
  meal.food_items.map((item, idx) => ({
    ...item,
    uid: `${meal.id}-item-${idx}`,
    entryId: meal.id,
  })),
  [meal.id, meal.food_items]
);
```

#### Edit Save Flow

When a field is edited and user presses Enter:
1. `onUpdateItem` or `onUpdateItemBatch` is called with index and new value
2. Handler updates local `editedItems` state
3. Handler calls `updateMeal.mutate({ id, foodItems: editedItems })`
4. Mutation updates JSONB in database and invalidates query
5. React Query refetches, component re-renders with new data

#### Strip Metadata Before Save

When saving to database, strip `uid`, `entryId`, and `editedFields`:

```tsx
const cleanedItems = editedItems.map(({ uid, entryId, editedFields, ...rest }) => rest);
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/SavedMealRow.tsx` | Create | Expand/collapse row with editable FoodItemsTable |
| `src/components/SavedRoutineRow.tsx` | Create | Expand/collapse row with editable WeightItemsTable |
| `src/pages/Settings.tsx` | Modify | Add expansion state, use new row components, reduce padding |
| `src/hooks/useSavedMeals.ts` | Modify | Update `useUpdateSavedMeal` to strip metadata from items |
| `src/hooks/useSavedRoutines.ts` | Modify | Update `useUpdateSavedRoutine` to strip metadata from items |

---

### Component Props

**SavedMealRow:**
```tsx
interface SavedMealRowProps {
  meal: SavedMeal;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateMeal: UseMutateFunction<...>;  // from useUpdateSavedMeal
  onDeleteMeal: UseMutateFunction<...>;  // from useDeleteSavedMeal
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
}
```

**SavedRoutineRow:**
```tsx
interface SavedRoutineRowProps {
  routine: SavedRoutine;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateRoutine: UseMutateFunction<...>;
  onDeleteRoutine: UseMutateFunction<...>;
  openDeletePopoverId: string | null;
  setOpenDeletePopoverId: (id: string | null) => void;
}
```

---

### Compact Layout Changes

Reduce vertical spacing for better mobile fit:
- List: `space-y-1` -> `space-y-0`
- Row: `py-1` -> `py-0.5`
- Keep expanded table indented with `pl-6`


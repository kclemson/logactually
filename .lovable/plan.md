

## Simplify Source ID Checking for Saved Meals/Routines

### Current Architecture

**Food Log:**
1. `FoodEntry` has `source_meal_id: string | null` at the entry level
2. `FoodLog.tsx` builds `entryMealNames: Map<entryId, mealName>` by looking up each `source_meal_id` in `savedMeals`
3. `FoodItemsTable` receives this map and checks `entryMealNames?.get(currentEntryId)` to decide what to show

**Weight Log:**
1. `WeightSet` has `sourceRoutineId: string | null` at the item level (only on the first set of each entry)
2. `WeightLog.tsx` builds `entryRoutineNames: Map<entryId, routineName>` by looking up each `sourceRoutineId` in `savedRoutines`
3. `WeightItemsTable` receives this map and checks `entryRoutineNames?.get(currentEntryId)` to decide what to show

### The Problem

The current approach has unnecessary indirection:
- We're checking "does the entry have a mapped name?" when we should be checking "does the entry have a source ID?"
- This causes bugs like the duplicate text issue: when `sourceRoutineId` exists but name lookup fails (e.g., deleted routine), the code falls through incorrectly
- It also means the table components don't know if an entry came from a saved item unless the lookup succeeded

### Proposed Simplification

**Pass source IDs directly to the table components:**

Instead of only passing the resolved name map, also pass a set or map of which entries have source IDs. The table can then:
1. Check if `hasSourceId` to determine behavior (show raw input vs. not, show "Save as" link vs. source link)
2. Use the name map only for displaying the link text (which may be unavailable if deleted)

### Changes

**1. WeightItemsTable.tsx - Add `entrySourceRoutineIds` prop**

```tsx
interface WeightItemsTableProps {
  // ... existing props
  entryRoutineNames?: Map<string, string>;
  /** Set of entry IDs that originated from a saved routine (even if routine was deleted) */
  entrySourceRoutineIds?: Set<string>;
}
```

Update the expanded section logic:
```tsx
// Check if this entry came from a saved routine
const isFromSavedRoutine = currentEntryId && entrySourceRoutineIds?.has(currentEntryId);
const routineName = currentEntryId && entryRoutineNames?.get(currentEntryId);

{/* Only show raw input if NOT from a saved routine */}
{!isFromSavedRoutine && currentRawInput && (
  <p className="text-muted-foreground whitespace-pre-wrap italic">
    {currentRawInput}
  </p>
)}

{/* Show routine info if from saved routine */}
{isFromSavedRoutine ? (
  <p className="text-sm text-muted-foreground italic">
    From saved routine:{' '}
    {routineName ? (
      <Link to="/settings" className="text-blue-600 dark:text-blue-400 hover:underline not-italic">
        {routineName}
      </Link>
    ) : (
      <span className="not-italic">(deleted)</span>
    )}
  </p>
) : onSaveAsRoutine && (
  <button ...>Save as routine</button>
)}
```

**2. WeightLog.tsx - Build `entrySourceRoutineIds` set**

```tsx
// Build set of entry IDs that came from saved routines (regardless of whether routine still exists)
const entrySourceRoutineIds = useMemo(() => {
  const set = new Set<string>();
  weightSets.forEach(set => {
    if (set.sourceRoutineId) {
      set.add(set.entryId);
    }
  });
  return set;
}, [weightSets]);
```

Pass it to the table:
```tsx
<WeightItemsTable
  // ... existing props
  entryRoutineNames={entryRoutineNames}
  entrySourceRoutineIds={entrySourceRoutineIds}
/>
```

**3. FoodItemsTable.tsx - Add `entrySourceMealIds` prop**

Same pattern:
```tsx
interface FoodItemsTableProps {
  // ... existing props
  entryMealNames?: Map<string, string>;
  /** Set of entry IDs that originated from a saved meal (even if meal was deleted) */
  entrySourceMealIds?: Set<string>;
}
```

**4. FoodLog.tsx - Build `entrySourceMealIds` set**

```tsx
// Build set of entry IDs that came from saved meals
const entrySourceMealIds = useMemo(() => {
  const set = new Set<string>();
  entries.forEach(entry => {
    if (entry.source_meal_id) {
      set.add(entry.id);
    }
  });
  return set;
}, [entries]);
```

---

### Risk Evaluation

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing behavior | Low | The name maps still exist; we're adding a parallel check, not removing anything |
| Inconsistent state between ID and name | Low | Clear logic: ID determines behavior, name is optional display data |
| More props to manage | Low | Two new props (one per table), but they're simple Sets with clear purpose |
| Migration effort | Low | Changes are additive and backward compatible |

### Complexity Assessment

**Before:**
- Page builds name map by looking up IDs in saved items list
- Table checks map for name → if present, show source info; else show save button
- Edge case (deleted source) falls through to "Save as" which is wrong

**After:**
- Page builds ID set (simple) + name map (existing)
- Table checks ID set → if from source, decide behavior
- Table uses name map → for display only, with fallback for deleted items
- Clear separation: ID for logic, name for display

**Lines of code:** ~20 new lines total across 4 files

### Benefits

1. **Fixes the duplicate text bug** - Raw input is hidden when `sourceRoutineId` exists, not when name lookup succeeds
2. **Handles deleted sources gracefully** - Shows "(deleted)" instead of incorrectly offering "Save as"
3. **Clearer mental model** - ID determines behavior, name is cosmetic
4. **More robust** - Works correctly even if `savedRoutines`/`savedMeals` query is stale or slow




## Track Source Routine for Weight Entries

This feature adds the ability to track which saved routine a weight entry came from, matching the existing `source_meal_id` pattern in food entries. This enables showing "Saved routine: [Name]" with a link to Settings in the expanded entry view.

### Overview

Currently, food entries have a `source_meal_id` column that links entries to the saved meal they came from. Weight entries don't have this tracking yet. We'll add `source_routine_id` to the `weight_sets` table and wire it through the UI.

---

### Changes

**1. Database Migration**

Add a `source_routine_id` column to the `weight_sets` table:
- Nullable UUID column (not all entries come from saved routines)
- No foreign key constraint needed (same pattern as food_entries)

```sql
ALTER TABLE weight_sets 
ADD COLUMN source_routine_id uuid DEFAULT NULL;
```

**2. Type Updates (`src/types/weight.ts`)**

Add `sourceRoutineId` to both `WeightSet` (UI type) and `WeightSetRow` (DB type):

```typescript
export interface WeightSet {
  // ... existing fields
  sourceRoutineId?: string | null;  // NEW: Links to saved_routines.id
}

export interface WeightSetRow {
  // ... existing fields
  source_routine_id: string | null;  // NEW
}
```

**3. Hook Updates (`src/hooks/useWeightEntries.ts`)**

- Update the query to map `source_routine_id` to `sourceRoutineId`
- Update `createEntry` mutation to accept and store `source_routine_id` on the first set

**4. WeightLog Updates (`src/pages/WeightLog.tsx`)**

- Import `useSavedRoutines` to get the routines list
- Build `entryRoutineNames` map (entry_id → routine name) similar to FoodLog's pattern
- Pass `entryRoutineNames` to `WeightItemsTable`
- Update `handleLogSavedRoutine` to pass the routine ID to `createEntryFromExercises`

**5. WeightItemsTable Updates (`src/components/WeightItemsTable.tsx`)**

- Add `entryRoutineNames?: Map<string, string>` prop
- In the expanded content section, add conditional rendering:
  - If entry has a routine name → show "Saved routine: [Name]" as a link to `/settings`
  - Else → show "Save as routine" link (existing behavior)

---

### Technical Details

**WeightItemsTable expanded section (lines 580-600)**

```tsx
{/* Expanded content section */}
{showEntryDividers && isLastInEntry && isCurrentExpanded && (
  <div className={cn('grid gap-0.5', gridCols)}>
    <div className="col-span-full pl-6 py-1 space-y-1">
      {currentRawInput && (
        <p className="text-muted-foreground whitespace-pre-wrap italic">
          {currentRawInput}
        </p>
      )}
      {/* Show routine name if from saved routine, otherwise show "Save as routine" */}
      {currentEntryId && entryRoutineNames?.get(currentEntryId) ? (
        <p className="text-sm text-muted-foreground">
          Saved routine:{' '}
          <Link 
            to="/settings" 
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {entryRoutineNames.get(currentEntryId)}
          </Link>
        </p>
      ) : onSaveAsRoutine && currentRawInput && (
        <button onClick={...} className="text-sm text-blue-600 ...">
          Save as routine
        </button>
      )}
    </div>
  </div>
)}
```

**WeightLog routine names map**

```typescript
// Build map of entryId -> routine name for entries from saved routines
const entryRoutineNames = useMemo(() => {
  const map = new Map<string, string>();
  // Get first set of each entry to find source_routine_id
  const seenEntries = new Set<string>();
  weightSets.forEach(set => {
    if (!seenEntries.has(set.entryId) && set.sourceRoutineId && savedRoutines) {
      const routine = savedRoutines.find(r => r.id === set.sourceRoutineId);
      if (routine) map.set(set.entryId, routine.name);
      seenEntries.add(set.entryId);
    }
  });
  return map;
}, [weightSets, savedRoutines]);
```

---

### Files to Modify

1. **Database**: New migration for `source_routine_id` column
2. `src/types/weight.ts` - Add `sourceRoutineId` to types
3. `src/hooks/useWeightEntries.ts` - Handle new column in fetch/create
4. `src/pages/WeightLog.tsx` - Build routine names map, pass to table
5. `src/components/WeightItemsTable.tsx` - Accept new prop, render routine link


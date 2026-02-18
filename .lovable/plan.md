

# Fix category save: async save with loading mask, no dialog flicker

## Approach

Instead of closing and reopening the dialog, we keep it open and let React's natural re-render cycle do the work. When the user changes category:

1. DetailDialog calls `onSave(updates)` which now returns a Promise
2. DetailDialog shows a loading overlay while awaiting the promise
3. WeightLog's save handler uses `mutateAsync` + `await invalidateQueries` and does NOT close the dialog
4. When the promise resolves, DetailDialog exits edit mode
5. React re-renders with fresh data from the refetched query, and `buildExerciseDetailFields` produces the correct field layout for the new category

No close/reopen, no flicker, no complex reactive layout logic.

## Changes

### 1. Add `applyCategoryChange` helper (`src/lib/exercise-metadata.ts`)

Small pure function mapping a category to its base `exercise_key`:

```typescript
export function applyCategoryChange(
  newCategory: 'strength' | 'cardio' | 'other'
): { exercise_key: string } {
  return { exercise_key: newCategory === 'other' ? 'other' : '' };
}
```

### 2. Make `onSave` optionally async (`src/components/DetailDialog.tsx`)

- Change `onSave` type from `(updates) => void` to `(updates) => void | Promise<void>`
- In `handleSave`, await the result if it's a Promise, showing a `saving` loading overlay on the dialog body while waiting
- On completion, exit edit mode (don't close the dialog -- the caller decides whether to close)
- Add a small loading mask component (semi-transparent overlay with a spinner) rendered when `saving` is true

```typescript
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  // ... existing diff/unit-conversion logic ...
  if (Object.keys(updates).length > 0) {
    const result = onSave(updates);
    if (result && typeof result.then === 'function') {
      setSaving(true);
      await result;
      setSaving(false);
    }
  }
  setEditing(false);
  setDraft({});
};
```

The loading overlay is a simple div over the dialog content:

```tsx
{saving && (
  <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-10 rounded-lg">
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
)}
```

### 3. Make category saves async in WeightLog (`src/pages/WeightLog.tsx`)

Split `handleDetailSave` behavior: if the save includes a category change (detected by checking for `exercise_key` in the processed updates from `applyCategoryChange`), use `mutateAsync` and wait for the query to refetch. Don't close the dialog.

```typescript
const handleDetailSave = useCallback(async (updates: Record<string, any>) => {
  if (!detailDialogItem || detailDialogItem.mode !== 'single') return;
  const item = displayItems[detailDialogItem.index];
  if (!item) return;

  const { regularUpdates, newMetadata } = processExerciseSaveUpdates(updates, item.exercise_metadata ?? null);
  const allUpdates: Record<string, any> = { ...regularUpdates };
  if (newMetadata !== (item.exercise_metadata ?? null)) {
    allUpdates.exercise_metadata = newMetadata;
  }

  if (Object.keys(allUpdates).length === 0) return;

  const isCategoryChange = 'exercise_key' in allUpdates
    && allUpdates.exercise_key !== item.exercise_key;

  if (isCategoryChange) {
    // Async path: save, wait for refetch, keep dialog open
    await updateSet.mutateAsync({ id: item.id, updates: allUpdates });
    await queryClient.invalidateQueries({ queryKey: ['weight-sets', date] });
    // Dialog stays open; DetailDialog exits edit mode; fresh data triggers re-render
  } else {
    updateSet.mutate({ id: item.id, updates: allUpdates });
    setDetailDialogItem(null);
  }
}, [detailDialogItem, displayItems, updateSet, queryClient, date]);
```

This requires importing `useQueryClient` in WeightLog (it likely already has access via the hook).

### 4. Clean up `processExerciseSaveUpdates` (`src/components/DetailDialog.tsx`)

Remove the `_exercise_category` to `exercise_key` mapping block (lines 803-812 from the last diff). Instead, the category select's `onChange` in `FieldEditItem` will call `applyCategoryChange` and merge the result into the draft directly, so `exercise_key` arrives as a regular update.

In `FieldEditItem`, when `_exercise_category` changes:

```typescript
if (effectiveField.key === '_exercise_category') {
  const patch = applyCategoryChange(value as any);
  updateDraft('_exercise_category', value);
  updateDraft('exercise_key', patch.exercise_key);
  return;
}
```

### 5. Remove stale draft-level exercise_key clearing (line 222-224)

The existing `if (effectiveField.key === '_exercise_category') updateDraft('exercise_key', '')` is replaced by the `applyCategoryChange` call above.

## UX flow

1. User opens an "Other" exercise, taps Edit, changes Category to "Strength"
2. `applyCategoryChange` sets `exercise_key = ''` in the draft
3. User taps Save
4. A subtle loading mask appears over the dialog (spinner)
5. The mutation saves `exercise_key: ''` to the DB
6. The query refetches with the updated data
7. Loading mask disappears, dialog exits edit mode
8. The dialog re-renders in read-only view with the correct Strength fields (Type dropdown, sets/reps/weight, etc.)
9. User can tap Edit again to pick an exercise type

## Files changed

| File | What |
|------|------|
| `src/lib/exercise-metadata.ts` | Add `applyCategoryChange()` helper |
| `src/components/DetailDialog.tsx` | Make `handleSave` async with loading state; clean up `_exercise_category` handling in `processExerciseSaveUpdates` and `FieldEditItem` |
| `src/pages/WeightLog.tsx` | Make `handleDetailSave` async; use `mutateAsync` + `invalidateQueries` for category changes; keep dialog open |


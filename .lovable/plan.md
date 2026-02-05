

## Simplify: Save Routine Directly Without Dialog

### Current Flow (Too Many Steps)
1. User sees save suggestion with editable exercises
2. User clicks "Save as Routine"
3. Dialog opens (redundantly showing same exercises)
4. User clicks "Save Routine" again
5. Routine saved

### New Flow (Direct Save)
1. User sees save suggestion with editable exercises
2. User clicks "Save as Routine"
3. Routine saved immediately → Toast confirmation

---

### Implementation

#### Update `WeightLog.tsx`

Replace the dialog-opening logic with direct save:

```typescript
const handleSaveAsRoutine = useCallback(() => {
  if (saveSuggestionExercises.length === 0) return;
  
  const exerciseSets: SavedExerciseSet[] = saveSuggestionExercises.map(e => ({
    exercise_key: e.exercise_key,
    description: e.description,
    sets: e.sets,
    reps: e.reps,
    weight_lbs: e.weight_lbs,
    duration_minutes: e.duration_minutes,
    distance_miles: e.distance_miles,
  }));
  
  const autoName = generateRoutineName(exerciseSets[0]);
  
  saveRoutine.mutate({
    name: autoName,
    originalInput: null,
    exerciseSets,
    isAutoNamed: true,
  }, {
    onSuccess: () => {
      toast.success(`Saved "${autoName}" as a routine`);
      setSaveSuggestion(null);
      setSaveSuggestionExercises([]);
    }
  });
}, [saveSuggestionExercises, saveRoutine]);
```

#### Remove Dialog State

Remove:
- `showCreateRoutineDialog` state
- `CreateRoutineDialog` component import (if only used for this flow)
- The dialog JSX

#### Update SaveSuggestionPrompt's `onSave` Handler

The `onSave` prop already points to the save handler - just update what it does internally.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/WeightLog.tsx` | Replace dialog-opening with direct `saveRoutine.mutate()` call |

---

### Edge Cases

1. **Save fails**: The mutation's `onError` shows a toast (already handled by the hook)
2. **Empty exercises**: Button is already disabled when `items.length === 0`
3. **User wants custom name**: They can use the "Create Routine" button in the header popover, which still opens the full dialog

---

### Result

One-click save from the suggestion prompt. The full `CreateRoutineDialog` remains available via the saved routines popover for users who want to create a routine from scratch with a custom name.


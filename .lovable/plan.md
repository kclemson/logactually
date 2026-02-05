

## Add `is_auto_named` Column to Track Auto-Generated Routine Names

### Overview

Instead of using regex to detect if a routine name is auto-generated, we add an explicit boolean column to the database. This is cleaner, more reliable, and future-proof.

---

### Database Change

**Add column to `saved_routines` table:**

```sql
ALTER TABLE saved_routines 
ADD COLUMN is_auto_named boolean NOT NULL DEFAULT true;
```

Default is `true` because:
- Almost no users have saved routines today
- When we auto-detect and suggest "Update Routine", the name was auto-generated
- The `SaveRoutineDialog` starts with the auto-generated name pre-filled

---

### Logic Changes

#### 1. Track User Edits in Save Dialogs

Both dialogs already track whether the user typed in the name field:
- `SaveRoutineDialog.tsx`: Has `userHasTyped` state (line 67)
- `CreateRoutineDialog.tsx`: Uses shared `CreateSavedDialog` component

**Update the save flow to pass `isAutoNamed`:**

| User Action | `is_auto_named` Value |
|-------------|----------------------|
| Accepts default name without typing | `true` |
| Types/edits the name field | `false` |

#### 2. Update Hook Interfaces

**`useSaveRoutine` params:**
```typescript
interface SaveRoutineParams {
  name: string;
  originalInput: string | null;
  exerciseSets: SavedExerciseSet[];
  isAutoNamed: boolean;  // NEW
}
```

**`useUpdateSavedRoutine` params:**
```typescript
interface UpdateSavedRoutineParams {
  id: string;
  name?: string;
  exerciseSets?: SavedExerciseSet[];
  isAutoNamed?: boolean;  // NEW (only set when name changes)
}
```

#### 3. Update Routine Flow

In `WeightLog.tsx`, when updating an existing routine:

```typescript
const handleUpdateExistingRoutine = () => {
  // Check if existing routine has auto-generated name
  if (matchingRoutineForSuggestion.is_auto_named && exerciseSets.length > 0) {
    // Regenerate name from first exercise
    const newName = generateRoutineName(exerciseSets[0]);
    updateSavedRoutine.mutate({
      id: matchingRoutineForSuggestion.id,
      name: newName,
      exerciseSets,
      isAutoNamed: true,  // Still auto-named
    });
  } else {
    // Keep existing custom name
    updateSavedRoutine.mutate({
      id: matchingRoutineForSuggestion.id,
      exerciseSets,  // name not included = unchanged
    });
  }
};
```

---

### Type Updates

**`SavedRoutine` type in `src/types/weight.ts`:**
```typescript
export interface SavedRoutine {
  id: string;
  user_id: string;
  name: string;
  original_input: string | null;
  exercise_sets: SavedExerciseSet[];
  use_count: number;
  last_used_at: string | null;
  is_auto_named: boolean;  // NEW
  created_at: string;
  updated_at: string;
}
```

**`MatchingRoutine` type** (already in repeated-entry-detection.ts):
```typescript
export interface MatchingRoutine {
  id: string;
  name: string;
  similarity: number;
  diffs: ExerciseDiff[];
  isAutoNamed: boolean;  // NEW - copy from saved routine
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| **Database migration** | Add `is_auto_named boolean NOT NULL DEFAULT true` column |
| `src/types/weight.ts` | Add `is_auto_named` to `SavedRoutine` interface |
| `src/hooks/useSavedRoutines.ts` | Add `isAutoNamed` param to save/update mutations |
| `src/components/SaveRoutineDialog.tsx` | Pass `!userHasTyped` as `isAutoNamed` to onSave callback |
| `src/components/CreateSavedDialog.tsx` | Track user edits to name field, pass `isAutoNamed` |
| `src/lib/repeated-entry-detection.ts` | Add `isAutoNamed` to `MatchingRoutine` interface |
| `src/lib/routine-naming.ts` | **New file**: `generateRoutineName()` helper (moved from SaveRoutineDialog) |
| `src/pages/WeightLog.tsx` | Check `isAutoNamed` flag instead of regex; regenerate name if true |

---

### Migration Path for Existing Data

Since almost no users have saved routines today, we can safely default all existing routines to `is_auto_named = true`. If a user later edits the name manually (separate feature), we'd set it to `false` at that point.

---

### Benefits Over Regex

1. **Reliable**: No false positives if a user names their routine like "Squats (3x5 @ 225 lbs)"
2. **Future-proof**: If we change the naming format, old routines still work correctly
3. **Simple**: A boolean check is clearer than regex patterns
4. **Explicit intent**: We're tracking what the user *did*, not guessing from the result


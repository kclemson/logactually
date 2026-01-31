

## Fix Cardio Duration Loss with Future-Proof Field Handling

### Problem

When cardio exercises are saved as routines or applied from routines, the `duration_minutes` field is lost because the code explicitly maps only 5 fields, missing the newer cardio fields.

### Solution

Switch from an **allowlist approach** (explicitly listing fields to keep) to a **blocklist approach** (explicitly listing runtime fields to drop, spreading the rest). This is more future-proof - when we add new persistent fields like `distance_miles`, they'll automatically flow through.

### Runtime Fields to Strip (Blocklist)

These are UI/client-side only and should NOT be saved to routines:

| Field | Reason |
|-------|--------|
| `id` | Database row ID for the logged set, not routine data |
| `uid` | Client-side React key |
| `entryId` | Groups exercises in current log session |
| `rawInput` | Stored separately at entry level |
| `sourceRoutineId` | Stored separately at entry level |
| `editedFields` | UI tracking for visual indicators |

Everything else (exercise_key, description, sets, reps, weight_lbs, duration_minutes, distance_miles, and any future fields) will automatically persist.

---

### Changes

**File 1: `src/hooks/useSavedRoutines.ts` (lines 93-100)**

Current code explicitly picks 5 fields:
```typescript
const cleanedSets = exerciseSets.map(({ exercise_key, description, sets, reps, weight_lbs }) => ({
  exercise_key,
  description,
  sets,
  reps,
  weight_lbs,
}));
```

New code strips runtime fields, spreads the rest:
```typescript
const cleanedSets = exerciseSets.map(({ 
  id, uid, entryId, rawInput, sourceRoutineId, editedFields,
  ...persistentFields 
}) => persistentFields);
```

---

**File 2: `src/pages/WeightLog.tsx` - `handleLogSavedRoutine` (lines 243-253)**

Current code explicitly picks 5 fields:
```typescript
const exercises = exerciseSets.map(set => ({
  exercise_key: set.exercise_key,
  description: set.description,
  sets: set.sets,
  reps: set.reps,
  weight_lbs: set.weight_lbs,
}));
```

New code uses spread (SavedExerciseSet already has no runtime fields, but this is safer for future):
```typescript
const exercises = exerciseSets.map(set => ({ ...set }));
```

---

**File 3: `src/pages/WeightLog.tsx` - `handleSaveRoutineConfirm` (lines 291-314)**

Current code explicitly picks 5 fields from WeightSet:
```typescript
const exerciseSets: SavedExerciseSet[] = saveRoutineDialogData.exerciseSets.map(set => ({
  exercise_key: set.exercise_key,
  description: set.description,
  sets: set.sets,
  reps: set.reps,
  weight_lbs: set.weight_lbs,
}));
```

New code strips runtime fields:
```typescript
const exerciseSets: SavedExerciseSet[] = saveRoutineDialogData.exerciseSets.map(({
  id, uid, entryId, rawInput, sourceRoutineId, editedFields,
  ...persistentFields
}) => persistentFields);
```

---

### Result

| Scenario | Before | After |
|----------|--------|-------|
| Save cardio as routine | `duration_minutes` lost | `duration_minutes` preserved |
| Apply cardio routine | Shows "0 0 0" | Shows "cardio" label |
| Add future field (e.g., `distance_miles`) | Would need manual update | Automatically works |

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useSavedRoutines.ts` | Switch to blocklist approach in `useUpdateSavedRoutine` |
| `src/pages/WeightLog.tsx` | Switch to blocklist approach in both `handleLogSavedRoutine` and `handleSaveRoutineConfirm` |


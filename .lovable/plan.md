## Saved Routines Feature - Phase 1 Complete ✅

### What was built

1. **Database**: `saved_routines` table with RLS policies
2. **Types**: `SavedRoutine` and `SavedExerciseSet` in `src/types/weight.ts`
3. **Hooks**:
   - `useSavedRoutines` - fetch all routines
   - `useSaveRoutine` - create new routine
   - `useUpdateSavedRoutine` - update name or exercises
   - `useDeleteSavedRoutine` - delete routine
   - `useLogSavedRoutine` - increment use_count, return exercises
   - `useSuggestRoutineName` - reuses suggest-meal-name edge function
4. **Components**:
   - `CreateSavedDialog` - generic shared dialog component
   - `CreateMealDialog` - thin wrapper with food config
   - `CreateRoutineDialog` - thin wrapper with weights config

### Next steps (Phase 2)

| File | Action |
|------|--------|
| `src/components/SavedRoutinesPopover.tsx` | Create - popover for selecting routines |
| `src/components/LogInput.tsx` | Modify - use SavedRoutinesPopover in weights mode |
| `src/pages/WeightLog.tsx` | Modify - integrate routine logging callbacks |
| `src/pages/Settings.tsx` | Modify - add "Saved Routines" management section |


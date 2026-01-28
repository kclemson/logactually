

## Saved Routines - Phase 2 Implementation

Phase 1 completed: database, types, hooks, and CreateRoutineDialog. Now we need to wire up the UI.

---

### Overview

| File | Action | Purpose |
|------|--------|---------|
| `src/components/SavedRoutinesPopover.tsx` | **Create** | Popover for selecting saved routines |
| `src/components/LogInput.tsx` | **Modify** | Render SavedRoutinesPopover in weights mode |
| `src/pages/WeightLog.tsx` | **Modify** | Pass routine logging callbacks to LogInput |
| `src/pages/Settings.tsx` | **Modify** | Add "Saved Routines" management section |

---

### 1. SavedRoutinesPopover Component

Mirror the existing `SavedMealsPopover` pattern:

```tsx
interface SavedRoutinesPopoverProps {
  onSelectRoutine: (exerciseSets: SavedExerciseSet[], routineId: string) => void;
  onClose?: () => void;
  onCreateNew?: () => void;
}
```

Features:
- List routines sorted by use_count
- Show exercise count per routine
- Search filter when 10+ routines
- "Add New Routine" button at top
- Loading spinner when selecting

---

### 2. LogInput Updates

Add new props for routine mode:

```tsx
interface LogInputProps {
  // ... existing props
  
  /** Weights mode: handler for logging saved routines */
  onLogSavedRoutine?: (exerciseSets: SavedExerciseSet[], routineId: string) => void;
  /** Weights mode: callback when user clicks "Add New" */
  onCreateNewRoutine?: () => void;
}
```

Conditional rendering in the "Saved" button popover:
- `mode === 'food'` → `SavedMealsPopover`
- `mode === 'weights'` → `SavedRoutinesPopover`

---

### 3. WeightLog Integration

Add state for CreateRoutineDialog and pass callbacks to LogInput:

```tsx
const [createRoutineDialogOpen, setCreateRoutineDialogOpen] = useState(false);

// Handle logging a saved routine
const handleLogSavedRoutine = (exerciseSets: SavedExerciseSet[], routineId: string) => {
  createEntryFromExercises(exerciseSets, `From routine: ${routineId}`);
};

<LogInput
  mode="weights"
  onLogSavedRoutine={handleLogSavedRoutine}
  onCreateNewRoutine={() => setCreateRoutineDialogOpen(true)}
  // ... other props
/>

{createRoutineDialogOpen && (
  <CreateRoutineDialog
    open={createRoutineDialogOpen}
    onOpenChange={setCreateRoutineDialogOpen}
    onRoutineCreated={(routine) => {
      // Optionally log immediately
    }}
    showLogPrompt={true}
  />
)}
```

---

### 4. Settings Page Updates

Add a "Saved Routines" section gated by `FEATURES.WEIGHT_TRACKING`:

```tsx
import { FEATURES } from '@/lib/feature-flags';
import { useSavedRoutines, useUpdateSavedRoutine, useDeleteSavedRoutine } from '@/hooks/useSavedRoutines';
import { CreateRoutineDialog } from '@/components/CreateRoutineDialog';
import { Dumbbell } from 'lucide-react';

// Inside Settings component:
{FEATURES.WEIGHT_TRACKING && (
  <CollapsibleSection
    title="Saved Routines"
    icon={Dumbbell}
    headerAction={
      <Button variant="outline" size="sm" onClick={() => setCreateRoutineDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    }
  >
    {/* Same pattern as Saved Meals: */}
    {/* - Editable names (contentEditable) */}
    {/* - Exercise count popover preview */}
    {/* - Delete with confirmation popover */}
  </CollapsibleSection>
)}
```

---

### Files Summary

| File | Changes |
|------|---------|
| `src/components/SavedRoutinesPopover.tsx` | Create - copy SavedMealsPopover pattern, adapt for routines |
| `src/components/LogInput.tsx` | Add `onLogSavedRoutine`, `onCreateNewRoutine` props; conditionally render popover by mode |
| `src/pages/WeightLog.tsx` | Add CreateRoutineDialog state, pass callbacks to LogInput |
| `src/pages/Settings.tsx` | Add "Saved Routines" CollapsibleSection gated by feature flag |


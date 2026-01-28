

## Add "Save as Routine" Entry Point

Users need a way to save their logged exercises as a reusable routine. Following the existing pattern from the food logging feature, we'll add a "Save as routine" link in the expanded entry section of the weight log.

---

### Overview

| File | Action | Purpose |
|------|--------|---------|
| `src/components/SaveRoutineDialog.tsx` | **Create** | Dialog to name and save a routine from existing entry |
| `src/components/WeightItemsTable.tsx` | **Modify** | Add "Save as routine" link in expanded section |
| `src/pages/WeightLog.tsx` | **Modify** | Handle save routine flow with dialog state |

---

### User Flow

1. User logs exercises (e.g., "3x10 lat pulldown at 65lbs")
2. User clicks the chevron to expand the entry
3. User sees raw input and a "Save as routine" link
4. Clicking opens `SaveRoutineDialog` with AI-suggested name
5. User confirms the name and saves
6. Routine is now available in the "Saved" popover

---

### Technical Details

**1. SaveRoutineDialog Component**

Mirror the `SaveMealDialog` pattern:

```tsx
interface SaveRoutineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawInput: string | null;
  exerciseSets: WeightSet[];
  onSave: (name: string) => void;
  isSaving: boolean;
  suggestedName: string | null;
  isSuggestingName: boolean;
}
```

Features:
- Input field for routine name
- Shows exercise count and preview
- Loading spinner while AI generates name
- Auto-focus input when name is ready
- Enter key to save, Escape to cancel

**2. WeightItemsTable Updates**

Add new props:
```tsx
interface WeightItemsTableProps {
  // ... existing props
  onSaveAsRoutine?: (entryId: string, rawInput: string | null, exerciseSets: WeightSet[]) => void;
  entryRoutineNames?: Map<string, string>;  // For entries already from routines
}
```

In the expanded section (after raw input display):
- If entry is from a saved routine: Show "Saved routine: {name}"
- Otherwise: Show "Save as routine" link

**3. WeightLog Integration**

Add state management:
```tsx
const [saveRoutineDialogData, setSaveRoutineDialogData] = useState<{
  entryId: string;
  rawInput: string | null;
  exerciseSets: WeightSet[];
} | null>(null);
const [suggestedRoutineName, setSuggestedRoutineName] = useState<string | null>(null);
```

Add handlers:
- `handleSaveAsRoutine`: Opens dialog, fires AI name suggestion in parallel
- `handleSaveRoutineConfirm`: Calls `useSaveRoutine` mutation

Pass to WeightItemsTable:
- `onSaveAsRoutine={handleSaveAsRoutine}`

---

### Files Summary

| File | Changes |
|------|---------|
| `src/components/SaveRoutineDialog.tsx` | Create - mirror SaveMealDialog for routines |
| `src/components/WeightItemsTable.tsx` | Add `onSaveAsRoutine` prop, render "Save as routine" link |
| `src/pages/WeightLog.tsx` | Add dialog state, name suggestion, save handlers |


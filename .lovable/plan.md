

## Create Unified `CreateSavedDialog` Component

### Architecture

Instead of duplicating `CreateMealDialog` → `CreateRoutineDialog`, we create a single generic component that accepts mode-specific configuration:

```text
CreateMealDialog (315 lines)     →     CreateSavedDialog (shared)
                                            ├── mode: 'food' | 'weights'
                                            └── config: { hooks, text, table }
```

### Mode Configuration Pattern

```typescript
interface CreateSavedDialogConfig<TItem, TSaved> {
  // Hooks
  useAnalyze: () => { analyze: (text: string) => Promise<TItem[] | null>, isAnalyzing: boolean, error: string | null };
  useSave: () => UseMutationResult<TSaved, ...>;
  useSuggestName: () => { suggestName: (items: TItem[]) => Promise<string | null>, isLoading: boolean };
  
  // UI Strings
  title: string;                    // "Create Saved Meal" | "Create Saved Routine"
  description: string;              // "Describe a meal to..." | "Describe a workout to..."
  inputLabel: string;               // "Ingredients" | "Exercises"
  inputPlaceholder: string;         // "Describe your meal..." | "Describe your workout..."
  namePlaceholder: string;          // "e.g., Morning smoothie" | "e.g., Push day"
  saveButton: string;               // "Save Meal" | "Save Routine"
  savedTitle: string;               // "Meal saved!" | "Routine saved!"
  logPrompt: (name: string) => string; // "X has been saved. Add to today's log?"
  
  // Table component
  ItemsTable: React.ComponentType<ItemsTableProps<TItem>>;
  
  // Data transformation
  getFallbackName: (items: TItem[]) => string;
  getDescriptions: (items: TItem[]) => string[];  // For name suggestion
}
```

### File Changes

| File | Action | Notes |
|------|--------|-------|
| `src/components/CreateSavedDialog.tsx` | **Create** | Generic component with mode config |
| `src/components/CreateMealDialog.tsx` | **Modify** | Thin wrapper that passes food config |
| `src/components/CreateRoutineDialog.tsx` | **Create** | Thin wrapper that passes weights config |
| `src/hooks/useSavedRoutines.ts` | **Create** | CRUD hooks for saved_routines table |
| `src/hooks/useSuggestRoutineName.ts` | **Create** | Name suggestion for routines (or reuse suggest-meal-name) |
| `src/types/weight.ts` | **Modify** | Add `SavedRoutine` type |
| Database migration | **Create** | `saved_routines` table |

---

### Implementation Details

**1. CreateSavedDialog.tsx (new generic component)**

Core logic extracted from CreateMealDialog, parameterized by config:

```tsx
interface CreateSavedDialogProps<TItem, TSaved> {
  mode: 'food' | 'weights';
  config: CreateSavedDialogConfig<TItem, TSaved>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (saved: TSaved, items: TItem[]) => void;
  showLogPrompt?: boolean;
}

export function CreateSavedDialog<TItem extends BaseItem, TSaved>({
  mode,
  config,
  open,
  onOpenChange,
  onCreated,
  showLogPrompt = true,
}: CreateSavedDialogProps<TItem, TSaved>) {
  // Same state machine: 'input' | 'analyzing' | 'editing' | 'saving' | 'prompting'
  // Same flow, but uses config.useAnalyze(), config.useSave(), etc.
  // Renders config.ItemsTable for the items display
  // Uses config strings for all UI text
}
```

**2. CreateMealDialog.tsx (becomes thin wrapper)**

```tsx
import { CreateSavedDialog } from './CreateSavedDialog';
import { FoodItemsTable } from './FoodItemsTable';
import { useAnalyzeFood } from '@/hooks/useAnalyzeFood';
import { useSaveMeal } from '@/hooks/useSavedMeals';
import { useSuggestMealName } from '@/hooks/useSuggestMealName';

const FOOD_CONFIG = {
  title: "Create Saved Meal",
  description: "Describe a meal to save for quick logging later.",
  inputLabel: "Ingredients",
  // ... other strings
  ItemsTable: FoodItemsTable,
  useAnalyze: useAnalyzeFood,
  useSave: useSaveMeal,
  useSuggestName: useSuggestMealName,
};

export function CreateMealDialog(props) {
  return <CreateSavedDialog mode="food" config={FOOD_CONFIG} {...props} />;
}
```

**3. CreateRoutineDialog.tsx (new thin wrapper)**

```tsx
const WEIGHTS_CONFIG = {
  title: "Create Saved Routine",
  description: "Describe a workout to save for quick logging later.",
  inputLabel: "Exercises",
  inputPlaceholder: "Describe your workout or list exercises",
  namePlaceholder: "e.g., Push day",
  saveButton: "Save Routine",
  savedTitle: "Routine saved!",
  // ...
  ItemsTable: WeightItemsTableForDialog,  // Simplified version without entry boundaries
  useAnalyze: useAnalyzeWeights,
  useSave: useSaveRoutine,
  useSuggestName: useSuggestRoutineName,
};

export function CreateRoutineDialog(props) {
  return <CreateSavedDialog mode="weights" config={WEIGHTS_CONFIG} {...props} />;
}
```

---

### Database Schema

**Table: `saved_routines`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL, RLS |
| name | text | NOT NULL |
| original_input | text | Nullable |
| exercise_sets | jsonb | Array of {exercise_key, description, sets, reps, weight_lbs} |
| use_count | integer | Default 0 |
| last_used_at | timestamptz | Nullable |
| created_at | timestamptz | Default now() |
| updated_at | timestamptz | Default now() |

**RLS policies:** Same pattern as saved_meals (users can CRUD their own)

---

### Type Definition

```typescript
// src/types/weight.ts
export interface SavedRoutine {
  id: string;
  user_id: string;
  name: string;
  original_input: string | null;
  exercise_sets: Omit<WeightSet, 'id' | 'uid' | 'entryId' | 'editedFields'>[];
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}
```

---

### Benefits of Shared Approach

1. **DRY**: ~80% code reuse, single source for dialog logic
2. **Consistency**: UX patterns stay synchronized (name generation, state machine, prompts)
3. **Maintainability**: Bug fixes in one place apply to both modes
4. **Follows existing patterns**: Mirrors how `LogInput` was generalized with `mode` prop

---

### Files Summary

| File | Action |
|------|--------|
| Database migration | Create `saved_routines` table with RLS |
| `src/types/weight.ts` | Add `SavedRoutine` type |
| `src/components/CreateSavedDialog.tsx` | Create - generic shared component |
| `src/components/CreateMealDialog.tsx` | Modify - thin wrapper with food config |
| `src/components/CreateRoutineDialog.tsx` | Create - thin wrapper with weights config |
| `src/hooks/useSavedRoutines.ts` | Create - CRUD hooks for routines |
| `src/hooks/useSuggestRoutineName.ts` | Create - or reuse suggest-meal-name edge function |




## Enhance Save Suggestion: Two Distinct Flows with Progression Diffs

### Overview

This plan implements two distinct user journeys when detecting repeated exercise patterns:

**Flow 1: Create New Routine** (current behavior, unchanged)
- User has logged similar exercises N times manually
- No saved routine exists with similar exercise keys
- Prompt: "Save as Routine"

**Flow 2: Update Existing Routine** (new feature)
- User has logged similar exercises N times manually
- AND a saved routine already exists with similar exercise keys (Jaccard similarity >= 0.7)
- Prompt shows routine name in header with progression diffs
- Two buttons: "Update Routine" (primary) + "Save as New" (secondary)

---

### User Experience

**Flow 2: Update Existing Routine**

```text
+------------------------------------------------------------------+
| [x]                                                              |
| You've logged this 3 times and it matches your saved             |
| routine "Morning Upper Body". Update it?                         |
|                                                                  |
|                            Sets   Reps   Lbs                     |
| +--------------------------------------------------------------+ |
| | Lat Pulldown              3      12     75                   | |
| +--------------------------------------------------------------+ |
|                                    +2     +5   <- diff row       |
|                                                                  |
| +------------------+ +---------------+                           |
| | Update Routine   | | Save as New   |      Don't suggest saves  |
| +------------------+ +---------------+                           |
+------------------------------------------------------------------+
```

Key UX details:
- Routine name appears in the header text (handles long names gracefully via text wrapping)
- Column headers shown above the exercise table
- Diff row appears below exercise rows with changed values
- Positive deltas in emerald/green, negative in amber/yellow
- Generic button labels: "Update Routine" and "Save as New"

---

### Technical Implementation

#### 1. New Types and Functions in `src/lib/repeated-entry-detection.ts`

**New types:**
```typescript
export interface ExerciseDiff {
  index: number;       // Which exercise in the new list
  sets?: number;       // Delta: +1, -2, etc. (undefined if unchanged)
  reps?: number;
  weight_lbs?: number;
}

export interface MatchingRoutine {
  id: string;
  name: string;
  similarity: number;
  diffs: ExerciseDiff[];
}
```

**New function to find matching saved routine:**
```typescript
export function findMatchingSavedRoutine(
  newExercises: AnalyzedExercise[],
  savedRoutines: SavedRoutine[]
): MatchingRoutine | null
```

Logic:
- Iterate saved routines, compute Jaccard similarity on exercise key sets
- For the best match with similarity >= 0.7:
  - Match exercises by `exercise_key`
  - Compute diffs: `newExercise.sets - savedExercise.sets`, etc.
  - Only include non-zero deltas
- If tied on similarity, prefer most recently used routine
- Return null if no match >= 0.7

#### 2. Update `SaveSuggestionPrompt` Component

**New props:**
```typescript
interface SaveSuggestionPromptProps<T> {
  // ... existing props ...
  
  // New: matching routine info for update flow
  matchingRoutine?: {
    id: string;
    name: string;
    diffs: Map<number, { sets?: number; reps?: number; weight_lbs?: number }>;
  };
  onUpdate?: () => void;  // Called when user clicks "Update Routine"
}
```

**Conditional rendering:**
- If `matchingRoutine` is provided:
  - Header text: "You've logged this **{matchCount} times** and it matches your saved routine **"{name}"**. Update it?"
  - Pass `showHeader={true}` to the table renderer
  - Pass `diffs` to the table renderer
  - Show two buttons: "Update Routine" (primary, calls `onUpdate`) + "Save as New" (secondary, calls `onSave`)
- If not provided:
  - Current behavior (single "Save as Routine" button)

#### 3. Add Diff Row Rendering to `WeightItemsTable`

**New prop:**
```typescript
interface WeightItemsTableProps {
  // ... existing props ...
  diffs?: Map<number, { sets?: number; reps?: number; weight_lbs?: number }>;
}
```

**Rendering logic:**
- After each item row, if `diffs?.has(index)` and has at least one non-zero delta:
  - Render a diff row using same grid layout (`grid-cols-[1fr_45px_45px_60px]`)
  - Description column: empty
  - Sets/Reps/Weight columns: show formatted delta (`+5`, `-2`) or empty
  - Colors: positive values in `text-emerald-600 dark:text-emerald-400`, negative in `text-amber-600 dark:text-amber-400`

**DiffValue helper component:**
```typescript
const DiffValue = ({ 
  value, 
  weightUnit 
}: { 
  value?: number; 
  weightUnit?: WeightUnit;
}) => {
  if (value === undefined || value === 0) return <span></span>;
  const formatted = weightUnit 
    ? formatWeight(value, weightUnit, false)  // Convert lbs to display unit
    : String(Math.abs(value));
  const sign = value > 0 ? '+' : '-';
  return (
    <span className={cn(
      "text-center text-xs font-medium",
      value > 0 
        ? "text-emerald-600 dark:text-emerald-400" 
        : "text-amber-600 dark:text-amber-400"
    )}>
      {sign}{formatted}
    </span>
  );
};
```

#### 4. Wire Up in `WeightLog.tsx`

**New state:**
```typescript
const [matchingRoutineForSuggestion, setMatchingRoutineForSuggestion] = 
  useState<MatchingRoutine | null>(null);
```

**Import the update mutation:**
```typescript
import { useSavedRoutines, useSaveRoutine, useUpdateSavedRoutine } from '@/hooks/useSavedRoutines';
// ...
const updateSavedRoutine = useUpdateSavedRoutine();
```

**After detecting a repeated entry, also check for matching routine:**
```typescript
const suggestion = detectRepeatedWeightEntry(analyzedExercises, recentWeightEntries);
if (suggestion && !isDismissed(suggestion.signatureHash)) {
  // Check if there's a matching saved routine to offer update
  const matchingRoutine = findMatchingSavedRoutine(
    analyzedExercises,
    savedRoutines ?? []
  );
  
  setSaveSuggestion(suggestion);
  setSaveSuggestionExercises([...suggestion.exercises]);
  setMatchingRoutineForSuggestion(matchingRoutine);
}
```

**New handler to update existing routine:**
```typescript
const handleUpdateExistingRoutine = useCallback(() => {
  if (!matchingRoutineForSuggestion) return;
  
  const exerciseSets: SavedExerciseSet[] = saveSuggestionExercises.map(e => ({
    exercise_key: e.exercise_key,
    description: e.description,
    sets: e.sets,
    reps: e.reps,
    weight_lbs: e.weight_lbs,
    duration_minutes: e.duration_minutes,
    distance_miles: e.distance_miles,
  }));
  
  updateSavedRoutine.mutate({
    id: matchingRoutineForSuggestion.id,
    exerciseSets,
  }, {
    onSuccess: () => {
      setSaveSuggestion(null);
      setSaveSuggestionExercises([]);
      setMatchingRoutineForSuggestion(null);
    }
  });
}, [matchingRoutineForSuggestion, saveSuggestionExercises, updateSavedRoutine]);
```

**Convert diffs to Map and pass to SaveSuggestionPrompt:**
```typescript
// In the render, before passing to SaveSuggestionPrompt
const diffsMap = useMemo(() => {
  if (!matchingRoutineForSuggestion) return undefined;
  const map = new Map<number, { sets?: number; reps?: number; weight_lbs?: number }>();
  for (const diff of matchingRoutineForSuggestion.diffs) {
    if (diff.sets || diff.reps || diff.weight_lbs) {
      map.set(diff.index, {
        sets: diff.sets,
        reps: diff.reps,
        weight_lbs: diff.weight_lbs,
      });
    }
  }
  return map.size > 0 ? map : undefined;
}, [matchingRoutineForSuggestion]);

// Pass to SaveSuggestionPrompt
<SaveSuggestionPrompt
  // ... existing props
  matchingRoutine={matchingRoutineForSuggestion ? {
    id: matchingRoutineForSuggestion.id,
    name: matchingRoutineForSuggestion.name,
    diffs: diffsMap,
  } : undefined}
  onUpdate={handleUpdateExistingRoutine}
/>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/repeated-entry-detection.ts` | Add `ExerciseDiff`, `MatchingRoutine` types; add `findMatchingSavedRoutine` function |
| `src/components/WeightItemsTable.tsx` | Add `diffs` prop; render diff row below items with `+N` / `-N` values |
| `src/components/SaveSuggestionPrompt.tsx` | Add `matchingRoutine` and `onUpdate` props; conditional header text and dual-button UI; pass `showHeader` and `diffs` to table |
| `src/pages/WeightLog.tsx` | Add `matchingRoutineForSuggestion` state; import `useUpdateSavedRoutine`; call `findMatchingSavedRoutine`; add `handleUpdateExistingRoutine` handler; convert diffs to Map; wire props |

---

### Edge Cases

1. **No changes at all**: If all diffs are zero, don't show the diff row but still offer update button (user may want to "confirm" the routine is current)

2. **Multiple exercises, only some changed**: Show diff row only under exercises with non-zero deltas

3. **Exercise order differs**: Match by `exercise_key`, not array position

4. **User edits values in the preview**: The edited values are what gets saved. The diffs are computed once when the suggestion is shown (based on initial analyzed values vs saved routine), so they remain static even if user edits. This is acceptable because the user can see both the current values and the deltas.

5. **Routine was deleted between detection and click**: Mutation will fail gracefully; error handling already exists in the hook

6. **Multiple matching routines**: Pick the one with highest Jaccard similarity; if tied, pick most recently used (based on `last_used_at`)

7. **Long routine names**: Name flows naturally in the paragraph text, wrapping as needed on mobile


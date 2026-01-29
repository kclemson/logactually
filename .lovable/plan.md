

## Implement Duplicate Exercise Detection and Merge

### Overview

Add runtime detection for exercises that share the same description but have different `exercise_key` values. Show a subtle inline prompt only when duplicates are detected, allowing users to merge them with a single tap.

---

### Files to Create

**1. `src/hooks/useMergeExercises.ts`**

A mutation hook that updates all `weight_sets` rows to consolidate duplicate exercise keys:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMergeExercises() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ keepKey, mergeKeys }: { 
      keepKey: string; 
      mergeKeys: string[] 
    }) => {
      const { error } = await supabase
        .from('weight_sets')
        .update({ exercise_key: keepKey })
        .in('exercise_key', mergeKeys);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-trends'] });
    },
  });
}
```

---

**2. `src/components/DuplicateExercisePrompt.tsx`**

A subtle card component that:
- Shows which exercise has duplicates
- Provides "Merge" and "Dismiss" actions
- Uses muted/warning styling to be noticeable but not intrusive

```typescript
interface DuplicateGroup {
  description: string;
  exercises: ExerciseTrend[];
  winner: ExerciseTrend;  // The one with most sessions
  losers: ExerciseTrend[]; // The ones to merge into winner
}

interface DuplicateExercisePromptProps {
  groups: DuplicateGroup[];
  onMerge: (group: DuplicateGroup) => void;
  onDismiss: () => void;
}
```

**UI Design:**
- Small card with amber/warning background tint
- Icon + text: "2 exercises may be duplicates"
- Shows the affected exercise description
- Two buttons: "Merge" (primary) and "Dismiss" (ghost)

---

### File to Modify

**`src/pages/Trends.tsx`**

**Add detection logic (after `weightExercises` query):**

```typescript
// Detect duplicate exercises (same description, different keys)
const duplicateGroups = useMemo(() => {
  const byDescription = new Map<string, ExerciseTrend[]>();
  
  weightExercises.forEach(ex => {
    const normalized = ex.description.toLowerCase().trim();
    const group = byDescription.get(normalized) || [];
    group.push(ex);
    byDescription.set(normalized, group);
  });
  
  // Filter to only groups with 2+ exercises, then structure for UI
  return [...byDescription.entries()]
    .filter(([_, exs]) => exs.length > 1)
    .map(([description, exercises]) => {
      // Winner = most sessions
      const sorted = [...exercises].sort((a, b) => b.sessionCount - a.sessionCount);
      return {
        description,
        exercises,
        winner: sorted[0],
        losers: sorted.slice(1),
      };
    });
}, [weightExercises]);
```

**Add dismiss state:**

```typescript
const [dismissedDuplicates, setDismissedDuplicates] = useState(() => 
  localStorage.getItem('dismissed-duplicate-exercises') === 'true'
);
```

**Add merge handler:**

```typescript
const mergeMutation = useMergeExercises();

const handleMerge = (group: DuplicateGroup) => {
  mergeMutation.mutate({
    keepKey: group.winner.exercise_key,
    mergeKeys: group.losers.map(ex => ex.exercise_key),
  });
};

const handleDismiss = () => {
  localStorage.setItem('dismissed-duplicate-exercises', 'true');
  setDismissedDuplicates(true);
};
```

**Render prompt conditionally (inside Weight Trends section, before the chart grid):**

```typescript
{duplicateGroups.length > 0 && !dismissedDuplicates && (
  <DuplicateExercisePrompt
    groups={duplicateGroups}
    onMerge={handleMerge}
    onDismiss={handleDismiss}
    isPending={mergeMutation.isPending}
  />
)}
```

---

### User Flow

```text
User opens Trends
       |
       v
  Fetch weight data
       |
       v
  Compute duplicateGroups (O(n))
       |
       v
  duplicates found AND not dismissed?
       |
   +---+---+
   No      Yes
   |        |
   v        v
(nothing)  Show DuplicateExercisePrompt
              |
        +-----+-----+
        |           |
     [Merge]    [Dismiss]
        |           |
        v           v
   Update DB     Save to localStorage
   rows to use   Hide prompt
   winner key
        |
        v
   Invalidate query
   Charts consolidate
```

---

### Summary

| File | Action | Lines (approx) |
|------|--------|----------------|
| `src/hooks/useMergeExercises.ts` | Create | ~25 |
| `src/components/DuplicateExercisePrompt.tsx` | Create | ~60 |
| `src/pages/Trends.tsx` | Modify | +35 |

- Detection runs only when exercise data changes (memoized)
- O(n) performance - negligible for 25 exercises
- UI only appears when duplicates exist AND user hasn't dismissed
- Single tap merges all instances to the most-used key
- Dismissible to avoid nagging users who prefer separate charts


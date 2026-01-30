

## Add Muscle Group Labels to Exercise Charts

### Overview

Add a `muscleGroup` field to canonical exercises and display it in the chart subtitles on the Trends page, using a minimal frontend lookup that only contains what's needed.

---

### File Changes

#### 1. `supabase/functions/_shared/exercises.ts`

**Add sync note after line 3:**
```typescript
//
// SYNC NOTE: Muscle group data is duplicated in src/lib/exercise-metadata.ts
// for frontend use. When adding/updating exercises, update BOTH files.
```

**Update interface to include muscleGroup:**
```typescript
export interface CanonicalExercise {
  key: string;
  name: string;
  aliases: string[];
  muscleGroup: string;
}
```

**Add muscleGroup to all exercises** using labels: `Chest`, `Shoulders`, `Triceps`, `Back`, `Biceps`, `Traps`, `Quads`, `Hamstrings`, `Glutes`, `Calves`, `Hips`, `Core`, `Full Body`

**Update `getExerciseReferenceForPrompt()`** to include muscle group in AI context.

---

#### 2. `src/lib/exercise-metadata.ts` (New File)

Minimal lookup with sync note:

```typescript
// Muscle group lookup for exercise charts on the Trends page
//
// SYNC NOTE: This duplicates data from supabase/functions/_shared/exercises.ts
// Edge functions (Deno) and frontend (Vite) run in separate build contexts,
// so we cannot share imports. When adding/updating exercises, update BOTH files.

export const EXERCISE_MUSCLE_GROUPS: Record<string, string> = {
  bench_press: 'Chest',
  leg_extension: 'Quads',
  leg_curl: 'Hamstrings',
  // ... all 50+ exercises
};

export function getMuscleGroup(exerciseKey: string): string | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey] || null;
}
```

---

#### 3. `src/pages/Trends.tsx`

**Add import:**
```typescript
import { getMuscleGroup } from '@/lib/exercise-metadata';
```

**Update subtitle (around line 132):**
```tsx
<ChartSubtitle>
  Max: {maxWeightDisplay} {unit}
  {getMuscleGroup(exercise.exercise_key) && (
    <> · {getMuscleGroup(exercise.exercise_key)}</>
  )}
</ChartSubtitle>
```

---

### Result

| Before | After |
|--------|-------|
| Max: 60 lbs | Max: 60 lbs · Quads |
| Max: 40 lbs | Max: 40 lbs · Hamstrings |


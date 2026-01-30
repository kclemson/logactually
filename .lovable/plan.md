

## Enhance Exercise Metadata with Primary/Secondary Muscle Groups

### Overview

Update exercise metadata to track primary and secondary muscle groups using authoritative sources (Wikipedia, ACE Fitness) and display them together in the Trends page chart subtitles.

---

### Agreed Simplified Labels

| Anatomical Term | Simplified Label |
|-----------------|------------------|
| Pectorals | Chest |
| Deltoids | Shoulders |
| Latissimus dorsi | Back |
| Trapezius | Upper Back |
| Lower back / Erector spinae | Lower Back |
| Biceps | Biceps |
| Triceps | Triceps |
| Forearms | Forearms |
| Quadriceps | Quads |
| Hamstrings | Hamstrings |
| Gluteus | Glutes |
| Hips | Hips |
| Calves | Calves |
| Abdominals | Abs |

---

### Data Sources

1. **Primary**: [Wikipedia - List of weight training exercises](https://en.wikipedia.org/wiki/List_of_weight_training_exercises) - Use "Yes" cells only
2. **Fallback**: [ACE Fitness Exercise Library](https://www.acefitness.org/resources/everyone/exercise-library/) - For exercises not in Wikipedia

---

### File Changes

#### 1. `src/lib/exercise-metadata.ts`

```typescript
// Muscle group lookup for exercise charts on the Trends page
//
// SOURCES:
// - Primary: https://en.wikipedia.org/wiki/List_of_weight_training_exercises
// - Fallback: https://www.acefitness.org/resources/everyone/exercise-library/
//
// SYNC NOTE: This duplicates data from supabase/functions/_shared/exercises.ts

export interface ExerciseMuscles {
  primary: string;
  secondary?: string[];
}

export const EXERCISE_MUSCLE_GROUPS: Record<string, ExerciseMuscles> = {
  // Upper Body - Push
  bench_press: { primary: 'Chest', secondary: ['Triceps'] },
  incline_bench_press: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },
  decline_bench_press: { primary: 'Chest', secondary: ['Triceps'] },
  dumbbell_press: { primary: 'Chest', secondary: ['Triceps'] },
  chest_fly: { primary: 'Chest' },
  shoulder_press: { primary: 'Shoulders', secondary: ['Triceps'] },
  lateral_raise: { primary: 'Shoulders' },
  front_raise: { primary: 'Shoulders' },
  tricep_pushdown: { primary: 'Triceps' },
  tricep_extension: { primary: 'Triceps' },
  dips: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },

  // Upper Body - Pull
  lat_pulldown: { primary: 'Back' },
  pull_up: { primary: 'Back' },
  seated_row: { primary: 'Back', secondary: ['Biceps'] },
  bent_over_row: { primary: 'Back', secondary: ['Biceps'] },
  dumbbell_row: { primary: 'Back', secondary: ['Biceps'] },
  t_bar_row: { primary: 'Back', secondary: ['Biceps'] },
  face_pull: { primary: 'Shoulders', secondary: ['Upper Back'] },
  rear_delt_fly: { primary: 'Shoulders' },
  bicep_curl: { primary: 'Biceps' },
  hammer_curl: { primary: 'Biceps', secondary: ['Forearms'] },
  preacher_curl: { primary: 'Biceps' },
  cable_curl: { primary: 'Biceps' },
  diverging_low_row: { primary: 'Back', secondary: ['Biceps'] },
  shrugs: { primary: 'Upper Back' },

  // Lower Body
  squat: { primary: 'Quads', secondary: ['Glutes', 'Hips', 'Abs'] },
  front_squat: { primary: 'Quads', secondary: ['Glutes', 'Abs'] },
  goblet_squat: { primary: 'Quads', secondary: ['Glutes', 'Abs'] },
  leg_press: { primary: 'Quads', secondary: ['Glutes', 'Hips'] },
  hack_squat: { primary: 'Quads', secondary: ['Glutes'] },
  leg_extension: { primary: 'Quads' },
  leg_curl: { primary: 'Hamstrings' },
  romanian_deadlift: { primary: 'Hamstrings', secondary: ['Glutes', 'Lower Back'] },
  hip_thrust: { primary: 'Glutes', secondary: ['Hamstrings'] },
  calf_raise: { primary: 'Calves' },
  seated_calf_raise: { primary: 'Calves' },
  lunge: { primary: 'Quads', secondary: ['Glutes', 'Hips'] },
  bulgarian_split_squat: { primary: 'Quads', secondary: ['Glutes'] },
  step_up: { primary: 'Quads', secondary: ['Glutes'] },

  // Compound / Full Body
  deadlift: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Hips', 'Lower Back'] },
  sumo_deadlift: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Hips'] },
  trap_bar_deadlift: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Lower Back'] },
  clean: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  snatch: { primary: 'Quads', secondary: ['Hamstrings', 'Glutes', 'Shoulders', 'Upper Back'] },
  kettlebell_swing: { primary: 'Glutes', secondary: ['Hamstrings', 'Abs'] },

  // Core
  cable_crunch: { primary: 'Abs' },
  hanging_leg_raise: { primary: 'Abs', secondary: ['Hips'] },
  ab_wheel: { primary: 'Abs' },
  plank: { primary: 'Abs' },
  russian_twist: { primary: 'Abs' },
  sit_up: { primary: 'Abs', secondary: ['Hips'] },
  crunch: { primary: 'Abs' },

  // Machines
  chest_press_machine: { primary: 'Chest', secondary: ['Triceps'] },
  shoulder_press_machine: { primary: 'Shoulders', secondary: ['Triceps'] },
  pec_deck: { primary: 'Chest' },
  cable_crossover: { primary: 'Chest' },
  smith_machine_squat: { primary: 'Quads', secondary: ['Glutes'] },
  smith_machine_bench: { primary: 'Chest', secondary: ['Triceps'] },
  hip_abduction: { primary: 'Hips' },
  hip_adduction: { primary: 'Hips' },
  glute_kickback: { primary: 'Glutes' },
  assisted_dip_machine: { primary: 'Chest', secondary: ['Triceps'] },
  assisted_pullup_machine: { primary: 'Back', secondary: ['Biceps'] },
};

// Returns formatted string for chart display: "Back, Biceps"
export function getMuscleGroupDisplay(exerciseKey: string): string | null {
  const muscles = EXERCISE_MUSCLE_GROUPS[exerciseKey];
  if (!muscles) return null;
  
  if (muscles.secondary?.length) {
    return `${muscles.primary}, ${muscles.secondary.join(', ')}`;
  }
  return muscles.primary;
}

// Returns just primary muscle (backwards compatibility)
export function getMuscleGroup(exerciseKey: string): string | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey]?.primary || null;
}

// Returns full muscle data object
export function getExerciseMuscles(exerciseKey: string): ExerciseMuscles | null {
  return EXERCISE_MUSCLE_GROUPS[exerciseKey] || null;
}
```

---

#### 2. `supabase/functions/_shared/exercises.ts`

Update interface and all exercise entries:

```typescript
export interface CanonicalExercise {
  key: string;
  name: string;
  aliases: string[];
  primaryMuscle: string;
  secondaryMuscles?: string[];
}
```

Example entries:
```typescript
{ key: 'squat', name: 'Squat', aliases: [...], primaryMuscle: 'Quads', secondaryMuscles: ['Glutes', 'Hips', 'Abs'] },
{ key: 'lat_pulldown', name: 'Lat Pulldown', aliases: [...], primaryMuscle: 'Back' },
{ key: 'diverging_low_row', name: 'Diverging Low Row', aliases: [...], primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
```

Update prompt formatter:
```typescript
export function getExerciseReferenceForPrompt(): string {
  return CANONICAL_EXERCISES
    .map(e => {
      const aliasText = e.aliases.length > 0 ? e.aliases.join(', ') : 'no common aliases';
      const secondary = e.secondaryMuscles?.length 
        ? ` + ${e.secondaryMuscles.join(', ')}` 
        : '';
      return `  - ${e.key}: "${e.name}" [${e.primaryMuscle}${secondary}] (also: ${aliasText})`;
    })
    .join('\n');
}
```

---

#### 3. `src/pages/Trends.tsx`

Update import and subtitle:

```typescript
import { getMuscleGroupDisplay } from '@/lib/exercise-metadata';
```

Update chart subtitle (around line 132-137):
```tsx
<ChartSubtitle>
  Max: {maxWeightDisplay} {unit}
  {getMuscleGroupDisplay(exercise.exercise_key) && (
    <> · {getMuscleGroupDisplay(exercise.exercise_key)}</>
  )}
</ChartSubtitle>
```

---

### Example UI Results

| Exercise | Before | After |
|----------|--------|-------|
| Squat | Max: 185 lbs · Quads | Max: 185 lbs · Quads, Glutes, Hips, Abs |
| Lat Pulldown | Max: 120 lbs · Back | Max: 120 lbs · Back |
| Diverging Low Row | Max: 70 lbs · Back | Max: 70 lbs · Back, Biceps |
| Deadlift | Max: 225 lbs · Full Body | Max: 225 lbs · Quads, Hamstrings, Glutes, Hips, Lower Back |
| Romanian Deadlift | Max: 135 lbs · Hamstrings | Max: 135 lbs · Hamstrings, Glutes, Lower Back |
| Shrugs | Max: 80 lbs · Traps | Max: 80 lbs · Upper Back |

---

### Note on "Full Body"

Based on Wikipedia, exercises like Deadlift don't have a single primary muscle - they hit many equally. I've proposed using "Quads" as primary with the rest as secondary based on the movement pattern, but we could also:
- Keep "Full Body" as primary with no secondary
- Pick the most commonly discussed muscle (e.g., "Lower Back" for deadlift)

Let me know your preference!


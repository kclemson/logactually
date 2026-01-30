

## Apply Muscle Group Mapping Refinements

### Overview

Incorporate the high-value fixes from the external review to better align muscle group mappings with user expectations and biomechanical reality.

---

### Changes Summary

| Exercise | Current | After |
|----------|---------|-------|
| lat_pulldown | Back (no secondary) | Back, **Biceps** |
| pull_up | Back (no secondary) | Back, **Biceps** |
| dumbbell_press | Chest, Triceps | Chest, Triceps, **Shoulders** |
| chest_fly | Chest (no secondary) | Chest, **Shoulders** |
| rear_delt_fly | Shoulders (no secondary) | Shoulders, **Upper Back** |
| deadlift | **Quads**, Hamstrings, Glutes, Hips, Lower Back | **Glutes**, Hamstrings, Quads, Hips, Lower Back |
| sumo_deadlift | **Quads**, Hamstrings, Glutes, Hips | **Glutes**, Hamstrings, Quads, Hips |
| trap_bar_deadlift | **Quads**, Hamstrings, Glutes, Lower Back | **Glutes**, Hamstrings, Quads, Lower Back |

---

### File Changes

#### 1. `src/lib/exercise-metadata.ts`

Update these entries in `EXERCISE_MUSCLE_GROUPS`:

```typescript
// Upper Body - Pull (add Biceps to pulling movements)
lat_pulldown: { primary: 'Back', secondary: ['Biceps'] },
pull_up: { primary: 'Back', secondary: ['Biceps'] },

// Upper Body - Push (add Shoulders where applicable)
dumbbell_press: { primary: 'Chest', secondary: ['Triceps', 'Shoulders'] },
chest_fly: { primary: 'Chest', secondary: ['Shoulders'] },

// Shoulders (add Upper Back to rear delt work)
rear_delt_fly: { primary: 'Shoulders', secondary: ['Upper Back'] },

// Compound (switch to Glutes as primary for posterior-chain dominance)
deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Hips', 'Lower Back'] },
sumo_deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Hips'] },
trap_bar_deadlift: { primary: 'Glutes', secondary: ['Hamstrings', 'Quads', 'Lower Back'] },
```

---

#### 2. `supabase/functions/_shared/exercises.ts`

Apply the same changes to `CANONICAL_EXERCISES` array:

```typescript
// Pull movements - add Biceps
{ key: 'lat_pulldown', ..., primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },
{ key: 'pull_up', ..., primaryMuscle: 'Back', secondaryMuscles: ['Biceps'] },

// Push movements - add Shoulders
{ key: 'dumbbell_press', ..., primaryMuscle: 'Chest', secondaryMuscles: ['Triceps', 'Shoulders'] },
{ key: 'chest_fly', ..., primaryMuscle: 'Chest', secondaryMuscles: ['Shoulders'] },

// Rear delt - add Upper Back
{ key: 'rear_delt_fly', ..., primaryMuscle: 'Shoulders', secondaryMuscles: ['Upper Back'] },

// Deadlifts - switch to Glutes primary
{ key: 'deadlift', ..., primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Hips', 'Lower Back'] },
{ key: 'sumo_deadlift', ..., primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Hips'] },
{ key: 'trap_bar_deadlift', ..., primaryMuscle: 'Glutes', secondaryMuscles: ['Hamstrings', 'Quads', 'Lower Back'] },
```

---

### UI Result Examples

| Exercise | Before | After |
|----------|--------|-------|
| Lat Pulldown | Max: 120 lbs · Back | Max: 120 lbs · Back, Biceps |
| Pull Up | Max: BW lbs · Back | Max: BW lbs · Back, Biceps |
| Dumbbell Press | Max: 50 lbs · Chest, Triceps | Max: 50 lbs · Chest, Triceps, Shoulders |
| Chest Fly | Max: 30 lbs · Chest | Max: 30 lbs · Chest, Shoulders |
| Rear Delt Fly | Max: 15 lbs · Shoulders | Max: 15 lbs · Shoulders, Upper Back |
| Deadlift | Max: 225 lbs · Quads, ... | Max: 225 lbs · Glutes, Hamstrings, Quads, Hips, Lower Back |


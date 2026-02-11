

## Fix Default Preview Exercises in Calorie Burn Dialog

### Problems

1. **Both cardio samples show as "Walk Run"** -- the two defaults use `walk_run` with subtypes `walking` and `running`, but the label function ignores `exercise_subtype`, so they appear identical.
2. **Strength samples could be more representative** -- currently `lat_pulldown` (3x10 @ 60 lbs) and `leg_press` (3x10 @ 150 lbs). More recognizable defaults like bench press and squat would be better first impressions.

### Changes

**File: `src/components/CalorieBurnDialog.tsx`**

**1. Make cardio samples distinct** -- use two different exercise keys instead of two subtypes of the same key:
- `walk_run` with subtype `walking` (25 min) -- "Walking"
- `cycling` (30 min) -- "Cycling"

**2. Use more recognizable strength samples:**
- `bench_press` (3x10 @ 135 lbs) -- classic upper body
- `squat` (3x10 @ 185 lbs) -- classic lower body

**3. Fix `exerciseLabel` to use subtype when available** -- when the exercise has a subtype (like `walking`), display the subtype name instead of the generic key name. This also benefits users whose actual data includes subtypes. Uses the existing `getSubtypeDisplayName` helper from `src/lib/exercise-metadata.ts`.

### Technical details

**Sample data changes (lines 36-44):**
```ts
const SAMPLE_CARDIO: ExerciseInput[] = [
  { exercise_key: 'walk_run', exercise_subtype: 'walking', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 25 },
  { exercise_key: 'cycling', sets: 0, reps: 0, weight_lbs: 0, duration_minutes: 30 },
];

const SAMPLE_STRENGTH: ExerciseInput[] = [
  { exercise_key: 'bench_press', sets: 3, reps: 10, weight_lbs: 135 },
  { exercise_key: 'squat', sets: 3, reps: 10, weight_lbs: 185 },
];
```

**Label function fix (line 46-50):**
Use `exercise_subtype` via `getSubtypeDisplayName()` when present, falling back to formatted `exercise_key`.

Result: "Walking (25 min)" and "Cycling (30 min)" instead of two identical "Walk Run" lines. Strength shows "Bench Press (3x10 @ 135 lbs)" and "Squat (3x10 @ 185 lbs)".


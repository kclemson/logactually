

## Comprehensive Cardio Support with Postel's Law (Final)

### System Prompt Changes - Detailed Diff Table

Here is a line-by-line breakdown of changes to `ANALYZE_WEIGHTS_PROMPT` in `supabase/functions/analyze-weights/index.ts`:

| Line | Change Type | Current Text | New Text |
|------|-------------|--------------|----------|
| 1 | **Update** | `You are a fitness assistant helping a user log their weight training workouts. Parse natural language workout descriptions and extract structured exercise data.` | `You are a fitness assistant helping a user log their workouts. Parse natural language workout descriptions and extract structured exercise data.` |
| 2 | Keep | `Analyze the following workout description and extract individual exercises with their set, rep, and weight information.` | (no change) |
| 3 | Keep | `Workout description: "{{rawInput}}"` | (no change) |
| 4-9 | **Update** | `For each exercise, provide:` followed by single flat list of all fields | Split into two sections: **WEIGHT EXERCISES** section first, then **CARDIO EXERCISES** section |
| 10-16 | Keep | Field definitions for `exercise_key`, `description`, `sets`, `reps`, `weight_lbs` | (moved into WEIGHT EXERCISES section, no text change) |
| 17 | **Add** | (not present) | New field: `- duration_minutes: duration in minutes (integer, for cardio only)` in CARDIO section |
| 18 | **Update** | `CANONICAL EXERCISE REFERENCE (prefer these keys when applicable):` | `CANONICAL WEIGHT EXERCISES (prefer these keys when applicable):` |
| 19 | Keep | `{{exerciseReference}}` | Renamed to `{{weightExerciseReference}}` |
| 20-26 | Keep | Handle common patterns examples | (no change) |
| 27 | Keep | `Default to lbs for weight if no unit is specified.` | (no change) |
| 28-35 | **Add** | (not present) | New CARDIO EXERCISES section with canonical reference |
| 36-37 | **Update** | JSON example shows only weight exercise | JSON example shows both weight AND cardio exercise |

### Full Before/After Comparison

**BEFORE (current prompt):**

```text
You are a fitness assistant helping a user log their weight training workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

For each exercise, provide:
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

CANONICAL EXERCISE REFERENCE (prefer these keys when applicable):
{{exerciseReference}}

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs
- "the machine where you pull the bar down to your chest" → lat_pulldown
- "leg pushing machine where you sit at an angle" → leg_press

Default to lbs for weight if no unit is specified.

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "exercise_key", "description": "Exercise Name", "sets": 3, "reps": 10, "weight_lbs": 100 }
  ]
}
```

**AFTER (proposed prompt):**

```text
You are a fitness assistant helping a user log their workouts. Parse natural language workout descriptions and extract structured exercise data.

Analyze the following workout description and extract individual exercises with their set, rep, and weight information.

Workout description: "{{rawInput}}"

## WEIGHT EXERCISES

For weight exercises, provide:
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
- description: a user-friendly name for the exercise (e.g., "Lat Pulldown", "Bench Press")
- sets: number of sets performed (integer)
- reps: number of reps per set (integer)
- weight_lbs: weight in pounds (number)

CANONICAL WEIGHT EXERCISES (prefer these keys when applicable):
{{weightExerciseReference}}

Handle common patterns like:
- "3x10 lat pulldown at 100 lbs" → 3 sets, 10 reps, 100 lbs
- "bench press 4 sets of 8 reps at 135" → 4 sets, 8 reps, 135 lbs
- "3 sets 10 reps squats 225" → 3 sets, 10 reps, 225 lbs
- "the machine where you pull the bar down to your chest" → lat_pulldown
- "leg pushing machine where you sit at an angle" → leg_press

Default to lbs for weight if no unit is specified.

## CARDIO / DURATION EXERCISES

For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly name (e.g., "Treadmill Walk", "Stationary Bike")
- duration_minutes: duration in minutes (integer)
- sets: 0
- reps: 0
- weight_lbs: 0

CANONICAL CARDIO EXERCISES (prefer these keys when applicable):
{{cardioExerciseReference}}

## RESPONSE FORMAT

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "exercises": [
    { "exercise_key": "bench_press", "description": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
    { "exercise_key": "treadmill", "description": "Treadmill Walk", "duration_minutes": 30, "sets": 0, "reps": 0, "weight_lbs": 0 }
  ]
}
```

### Summary of Prompt Changes

| # | Section | Change Type | Description |
|---|---------|-------------|-------------|
| 1 | Opening line | **Update** | Remove "weight training" → just "workouts" |
| 2 | Field definitions | **Reorganize** | Move existing fields under new `## WEIGHT EXERCISES` header |
| 3 | Reference header | **Update** | Rename to `CANONICAL WEIGHT EXERCISES` |
| 4 | Template variable | **Update** | `{{exerciseReference}}` → `{{weightExerciseReference}}` |
| 5 | Cardio section | **Add** | New `## CARDIO / DURATION EXERCISES` section with field definitions |
| 6 | Cardio reference | **Add** | New `{{cardioExerciseReference}}` placeholder |
| 7 | Response format | **Add** | New `## RESPONSE FORMAT` header for clarity |
| 8 | JSON example | **Update** | Add cardio exercise example alongside weight example |

---

### Other File Changes

#### Database Migration

```sql
ALTER TABLE weight_sets 
  ADD COLUMN duration_minutes integer,
  ADD COLUMN distance_miles numeric;

ALTER TABLE weight_sets
  ALTER COLUMN sets SET DEFAULT 0,
  ALTER COLUMN reps SET DEFAULT 0,
  ALTER COLUMN weight_lbs SET DEFAULT 0;
```

#### `supabase/functions/_shared/exercises.ts`

| Change | Description |
|--------|-------------|
| Add `isCardio?: boolean` to `CanonicalExercise` interface | New optional field |
| Add 9 cardio exercises to `CANONICAL_EXERCISES` array | treadmill, stationary_bike, elliptical, rowing_machine, stair_climber, walking, running, swimming, jump_rope |
| Rename `getExerciseReferenceForPrompt()` → `getWeightExerciseReferenceForPrompt()` | Filter to `!e.isCardio` |
| Add `getCardioExerciseReferenceForPrompt()` | Filter to `e.isCardio === true` |

#### `supabase/functions/analyze-weights/index.ts` (Validation)

| Change | Description |
|--------|-------------|
| Import both helper functions | `getWeightExerciseReferenceForPrompt`, `getCardioExerciseReferenceForPrompt` |
| Add lenient coercion | `Number(x) \|\| 0` for all numeric fields |
| Add `duration_minutes` extraction | `Number(exercise.duration_minutes) \|\| 0` |
| Update validation logic | Accept if `(sets > 0 && reps > 0)` OR `(duration_minutes > 0)` |
| Include `duration_minutes` in response | Add to `normalizedExercises` output |

#### `src/lib/exercise-metadata.ts`

| Change | Description |
|--------|-------------|
| Add `isCardio?: boolean` to `ExerciseMuscles` interface | New optional field |
| Add 9 cardio exercises to `EXERCISE_MUSCLE_GROUPS` | Same keys as backend |
| Add `isCardioExercise(key)` helper function | Returns true if `isCardio === true` |

#### `src/types/weight.ts`

| Change | Description |
|--------|-------------|
| Add to `WeightSet` interface | `duration_minutes?: number \| null` and `distance_miles?: number \| null` |
| Add to `AnalyzedExercise` interface | `duration_minutes?: number \| null` |
| Add to `WeightSetRow` interface | `duration_minutes: number \| null` and `distance_miles: number \| null` |

#### `src/hooks/useWeightEntries.ts`

| Change | Description |
|--------|-------------|
| Map new fields from DB | Add `duration_minutes` and `distance_miles` to returned objects |
| Include in insert | Add columns to insert rows |

#### `src/hooks/useWeightTrends.ts`

| Change | Description |
|--------|-------------|
| Add to `WeightPoint` interface | `duration_minutes?: number` |
| Select new column | Add `duration_minutes` to query |
| Aggregate duration for cardio | Sum `duration_minutes` by date for cardio exercises |

#### `src/pages/Trends.tsx`

| Change | Description |
|--------|-------------|
| Add cardio detection | `isCardio = maxWeight === 0 && weightData.some(d => d.duration_minutes > 0)` |
| Conditional Y-axis | Use `duration_minutes` for cardio, `weight` for weights |
| Conditional labels | Show "30 min" for cardio, "3×10×135" for weights |
| Conditional subtitle | Show "Cardio" for cardio, "Max: X lbs" for weights |

#### `src/components/WeightItemsTable.tsx`

| Change | Description |
|--------|-------------|
| Detect cardio rows | `weight_lbs === 0 && (duration_minutes \|\| 0) > 0` |
| Display duration | Show "30 min" in weight column for cardio |
| Show dashes | Display "—" for sets/reps columns when both are 0 |

---

### Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| AI returns neither weight nor cardio data | Low | Lenient validation returns clear error message |
| Existing weight data affected | None | New columns nullable; defaults only affect new inserts |
| Weight exercises misdetected as cardio | Very Low | Requires weight=0 AND duration>0 |
| Prompt length increase | Low | ~20 additional lines; well within token limits |


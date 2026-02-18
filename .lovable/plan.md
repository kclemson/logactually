

# Add "Other" exercise category -- hide exercise type/subtype, show universal metadata

## What changes

Three categories now drive the exercise detail dialog field layout:

- **Strength**: Name, Exercise type, (Subtype), Sets, Reps, Weight, Effort, Cal Burned, Heart Rate
- **Cardio**: Name, Exercise type, (Subtype), Distance, Duration, Cal Burned, Effort, Speed, Heart Rate, Incline, Cadence
- **Other**: Name only (no Exercise type or Subtype), plus Effort, Cal Burned, Heart Rate

## Technical changes (all in `src/components/DetailDialog.tsx`)

### 1. Add "Other" option to category dropdown (line 633-636)

```typescript
options: [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Other' },
],
```

### 2. Derive "other" for unknown exercise keys in `flattenExerciseValues` (line 696)

```typescript
flat._exercise_category = isCardioExercise(item.exercise_key)
  ? 'cardio'
  : (EXERCISE_MUSCLE_GROUPS[item.exercise_key] ? 'strength' : 'other');
```

### 3. Update `buildExerciseDetailFields` to accept a category override (lines 623-691)

Add a second parameter `categoryOverride?: string` so the edit grid can pass the draft category. The function becomes a three-way branch:

- **"other"**: Only the Name row (with category dropdown) plus Effort, Cal Burned, Heart Rate metadata. No Exercise type, no Subtype, no sets/reps/weight, no duration/distance.
- **"cardio"**: Current cardio layout (unchanged)
- **"strength"** (default): Current strength layout (unchanged)

### 4. Pass draft category when rebuilding fields during editing (line 487/512)

In the multi-item editing path, call `buildFields` with the draft's `_exercise_category` merged in, so switching to "Other" immediately hides exercise type/subtype and shows the correct metadata fields.

### 5. Category change handler (line 264)

When switching to "other", clear `exercise_key` (same as existing behavior). When switching from "other" to strength/cardio, also clear `exercise_key` (already happens).

## What stays the same

- Database schema -- no changes; `_exercise_category` is virtual (never persisted)
- Calorie burn estimation -- already falls back for unknown keys
- Trends charts -- already handle unknown keys with raw-key fallback display
- Edge function (analyze-weights) -- no changes; ad-hoc keys are already produced


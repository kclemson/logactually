

# Add Category, Type, and Subtype columns to Exercise CSV Export

## Summary
Add three new columns -- **Category**, **Type**, **Subtype** -- to the left of the existing "Exercise" column in the exported CSV.

## New column order
Date | Time | **Category** | **Type** | **Subtype** | Exercise | Sets | Reps | Weight (lbs) | Weight (kg) | Duration (min) | Distance (mi) | Distance (km) | Incline (%) | Effort (1-10) | Calories Burned | Heart Rate (bpm) | Cadence (rpm) | Speed (mph) | Speed (km/h) | Raw Input

## Technical changes

### 1. `src/hooks/useExportData.ts`
- Add `exercise_key, exercise_subtype` to the `.select(...)` string
- Add to row mapping: `exercise_key: row.exercise_key`, `exercise_subtype: row.exercise_subtype ?? null`

### 2. `src/lib/csv-export.ts`
- Import `isCardioExercise` from `@/lib/exercise-metadata`
- Add `exercise_key: string` and `exercise_subtype?: string | null` to `WeightSetExport` interface
- Update `headers` array to insert `Category`, `Type`, `Subtype` before `Exercise`
- In the row mapping, insert three values before `set.description`:
  - Category: `isCardioExercise(set.exercise_key) ? 'Cardio' : set.exercise_key === 'other' ? 'Other' : 'Strength'`
  - Type: `set.exercise_key`
  - Subtype: `set.exercise_subtype ?? ''`

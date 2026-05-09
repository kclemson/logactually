## Add estimated calorie burn to exercise CSV export

### Problem
The exercise CSV export's "Calories Burned" column only shows manually entered values (`calories_burned_override`). The system-calculated `calories_burned_estimate` (already fetched in `useExportData.fetchAllWeightSets`) is dropped on the floor.

### Change — `src/lib/csv-export.ts`

Split into two columns to preserve the distinction between user-entered and system-estimated values.

1. **Headers** (line ~178): Replace `'Calories Burned'` with `'Calories Burned', 'Calories Burned (Estimated)'`.

2. **Row mapping** (lines 196, 218): 
   - Keep `calBurned` as override-only: `set.calories_burned_override ?? set.exercise_metadata?.calories_burned ?? ''` (the JSONB fallback is for legacy override values).
   - Add `calBurnedEstimate = set.calories_burned_estimate ?? ''`.
   - Insert `calBurnedEstimate` into the row immediately after `calBurned`.

### Result
CSV now has 22 columns. Manual overrides stay in "Calories Burned"; system estimates appear in "Calories Burned (Estimated)". Empty cells where the relevant value isn't present.
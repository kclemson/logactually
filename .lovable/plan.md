
## Remove Duplicate Cardio Summary from Expanded Section

### What changes

The cardio stats line (e.g., "0.40 mi in 5:20 (13:20/mi, 4.5 mph)") is already displayed in italics beneath the sets/reps/lbs columns in the row summary. Repeating it in the expanded detail section is redundant. This change removes that block.

### Technical Details

**`src/components/WeightItemsTable.tsx`** -- delete the cardio metadata block (lines 755-789):

Remove the entire `{/* Cardio metadata */}` section that maps over `cardioItems` and renders the distance/duration/pace paragraph elements. The `cardioItems` variable (lines 748-750) and `entryExercises` (line 745) should be kept since `entryExercises` is used by the calorie burn estimate block below.

### Files Changed
- `src/components/WeightItemsTable.tsx` -- remove lines 755-789 (cardio metadata in expanded section)

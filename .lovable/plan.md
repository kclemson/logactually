

# Remove speed from cardio list view labels

## Problem
Cardio exercises in the weight log list view currently show distance, time, **and** speed (e.g., "1.50 mi, 18:05, 5.0 mph"). The speed value makes the label long and creates a visual impression of trying to align with the Sets/Reps/Lbs columns. The user wants only distance + time shown.

## Fix

### `src/components/WeightItemsTable.tsx`
Remove lines 601-604 which calculate and append the speed value to the cardio label. The label will then show only distance and duration (e.g., "1.50 mi, 18:05").

Before: `1.50 mi, 18:05, 5.0 mph`
After: `1.50 mi, 18:05`

Four lines removed, no other changes needed.


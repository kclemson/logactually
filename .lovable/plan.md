

## Five Polish Fixes for Calorie Target Feature

### 1. Fix input styling (placeholder centering, text alignment, width)

Change the input from `text-right` to `text-center` so both the "Not set" placeholder and entered values are centered. Reduce width from `w-24` to `w-20` since values are at most 5 digits.

### 2. Reorder "Daily Calorie Target" above "Show Weights"

Within the Preferences section, move the Daily Calorie Target block to sit between Theme and Show Weights. This creates a hierarchy: general (theme) → food (calorie target) → weights (show weights, weight units).

### 3. Move Preferences section above Saved Meals

Reorder the top-level collapsible sections so Preferences comes right after Account, before Saved Meals and Saved Routines. This way toggling "Show Weights" won't cause as much UI jitter since Saved Routines (which conditionally appears) is below Preferences.

New order:
1. Account
2. Preferences
3. Saved Meals
4. Saved Routines
5. Export to CSV
6. About

### 4. Make the calendar dot slightly larger and vertically centered

Change the dot from `text-[8px]` to `text-[10px]` (matching the calorie text size) and add `align-middle` or use `leading-none` to vertically center it with the calorie text. Also adjust margin from `ml-[1px]` to `ml-0.5`.

### 5. Files changed

| File | Changes |
|------|---------|
| `src/pages/Settings.tsx` | Reorder sections (Preferences before Saved Meals); move Daily Calorie Target above Show Weights; fix input classes (`text-center`, `w-20`) |
| `src/pages/History.tsx` | Change dot from `text-[8px]` to `text-[10px]`, add vertical alignment |


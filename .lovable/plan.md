

# CalorieTargetDialog Improvements

## Changes

### 1. Target deficit: move "cal/day" to the right of the input box
Change the label from "Target deficit (cal/day)" to just "Target deficit", and add a "cal/day" unit label to the right of the input box, matching the style used by BiometricsInputs (like "years" next to age).

### 2. Remove BiometricsInputs from exercise adjusted mode
The biometrics fields (weight, height, age, metabolic profile) are only needed for body_stats mode (BMR calculation). Exercise adjusted mode just needs a base goal number. Remove the `<BiometricsInputs>` component from the exercise_adjusted section.

### 3. Exercise adjusted: move "cal/day" to the right of the base goal input
Change the label from "Base goal (cal/day)" to just "Base goal", and add "cal/day" to the right of the input box, same pattern as change 1.

### 4. Reword the exercise adjusted explanation
Replace "Your daily target increases by calories burned from logged exercises" with something like: "Your target for each day is this base goal plus any calories you burn through logged exercises, so active days give you more room."

This frames it as "active days give you more room" rather than the more clinical "target increases by calories burned."

## Technical details

All changes are in `src/components/CalorieTargetDialog.tsx`:

| Lines | Change |
|---|---|
| 230-231 | Label: "Target deficit (cal/day)" becomes "Target deficit"; add `cal/day` styled label after input |
| 281-305 | Remove `<BiometricsInputs>` from exercise_adjusted block |
| 284 | Label: "Base goal (cal/day)" becomes "Base goal"; add `cal/day` styled label after input |
| 299-301 | Reword explanation text |

For the "cal/day" labels, they will use the same styling as BiometricsInputs' "years" label: `text-xs px-1.5 py-0.5 rounded bg-primary/10 text-foreground font-medium`.


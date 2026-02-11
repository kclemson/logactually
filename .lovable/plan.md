

## Fix Calorie Burn Dialog: Smooth Toggle + Age-Aware Estimates

### Issue 1: Jarring dialog resize on toggle

When the toggle is flipped, the entire configuration section conditionally renders (`{settings.calorieBurnEnabled && (...)}`), causing the dialog to snap to a new height. Fix: always render the content but collapse it with a CSS transition when disabled, so the dialog smoothly animates its height.

### Issue 2: Age (and height) don't affect calorie previews

The `estimateCalorieBurn` function in `calorie-burn.ts` accepts `age` and `heightInches` in settings but never uses them. The Mifflin-St Jeor BMR equation should be used to produce a metabolic scaling factor when all three biometrics (weight, height, age) are available.

**Mifflin-St Jeor equations:**
- Male: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 5 (kcal/day)
- Female: BMR = 10 x weight(kg) + 6.25 x height(cm) - 5 x age - 161 (kcal/day)
- Population average: midpoint of male/female

The adjustment works as a ratio: `userBMR / referenceBMR` where the reference BMR is for a "typical" person of the same weight (e.g., 170cm, 30 years old, population average). This scales calories up or down by a few percent based on how the user's metabolism differs from the reference.

### Technical Details

**`src/lib/calorie-burn.ts`** -- add BMR-aware scaling:

1. Add a `getBmrScalingFactor` function that:
   - Returns 1.0 if height or age is missing (no adjustment)
   - Computes user BMR and reference BMR using Mifflin-St Jeor
   - Returns `userBMR / referenceBMR` as a multiplier
2. Apply this multiplier in `estimateCalorieBurn` after the composition multiplier (step 7/8), multiplying both low and high by it

**`src/components/CalorieBurnDialog.tsx`** -- smooth toggle transition:

1. Replace the conditional render (`{settings.calorieBurnEnabled && (...)}`) with an always-rendered wrapper that uses `overflow-hidden` and a CSS transition on `max-height` (or `grid-rows` trick)
2. Use `grid transition-[grid-template-rows] duration-300` with `grid-rows-[0fr]` / `grid-rows-[1fr]` pattern for smooth collapse/expand without needing to know exact height

**`src/lib/calorie-burn.test.ts`** -- update tests:

Add test cases verifying that changing age produces different calorie estimates when height and weight are also provided.

### Files Changed
- `src/lib/calorie-burn.ts` -- add `getBmrScalingFactor`, apply in `estimateCalorieBurn`
- `src/components/CalorieBurnDialog.tsx` -- smooth animated toggle for config section
- `src/lib/calorie-burn.test.ts` -- add age-sensitivity test cases


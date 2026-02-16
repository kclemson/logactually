

# Add changelog entry for calorie target modes

## Changes

1. **Copy screenshot** `user-uploads://dailycalorietarget-screenshot-3.png` to `public/changelog/calorie-target-modes.png`

2. **Add entry** at the top of `CHANGELOG_ENTRIES` in `src/pages/Changelog.tsx`:

```
{ date: "Feb-15", text: "Expanded the existing 'daily calorie target' feature to support two new modes: 'Exercise adjusted' mode offsets the calorie count from your food intake by calories burned from logged exercises. 'Estimated burn rate minus a deficit' uses your activity level and body stats to calculate your BMR/TDEE and then subtracts a daily deficit you set.", image: "calorie-target-modes.png" }
```

`LAST_UPDATED` already says `"Feb-15-26"` -- no change needed.

## Text review

The updated phrasing "offsets the calorie count from your food intake" is accurate -- in `exercise_adjusted` mode the burn midpoint is added to the base goal, effectively offsetting calories consumed against calories burned. The `body_stats` description correctly references BMR/TDEE calculation and deficit subtraction, matching the implementation in `calorie-target.ts`.


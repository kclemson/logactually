

# Tappable calorie burn override from the expanded panel

## What changes

When calorie burn estimates are shown in the expanded exercise panel ("Estimated calories burned: ~80-150"), tapping on that line reveals an inline input for each exercise, letting the user type an exact calorie burn number. This gets saved to `exercise_metadata.calories_burned`, which the system already treats as an authoritative override (skipping the estimation logic entirely).

## UX flow

1. User expands an exercise entry via the chevron
2. Sees "Estimated calories burned: ~80-150 cal"
3. Taps the calorie burn line
4. The text is replaced by one input per exercise in the entry, pre-filled with the midpoint of the range (or the existing override if one was already set)
5. User types a number and presses Enter or taps away
6. The value is saved to `exercise_metadata.calories_burned` on that exercise's database row
7. The line reverts to text, now showing the exact number instead of a range

For single-exercise entries: one input. For multi-exercise entries: one labeled input per exercise.

Tapping "Estimated calories burned" again (or tapping elsewhere) collapses back to the display text.

## Technical approach

### `src/components/WeightItemsTable.tsx`

- Extract the calorie burn content into a new small component `CalorieBurnInline` rendered inside the expanded panel's `extraContent`
- Add local state `editingCalorieBurn` (boolean) to toggle between display and edit mode
- In edit mode, render one small input per exercise in the entry, each showing the current `exercise_metadata.calories_burned` value (or the estimated midpoint as placeholder)
- On commit (Enter/blur), call a new callback prop `onUpdateCalorieBurn(itemIndex, calorieValue)` which the parent page provides

### `src/pages/WeightLog.tsx`

- Add `handleUpdateCalorieBurn(index: number, value: number)` callback
- This merges `{ calories_burned: value }` into the item's existing `exercise_metadata` and calls `updateSet.mutate`
- Pass this callback down to `WeightItemsTable`

### No other files change

- `calorie-burn.ts` already handles `exercise_metadata.calories_burned` as an authoritative override (returns `{ type: 'exact', value }`)
- The display formatting already handles exact values vs ranges
- `processExerciseSaveUpdates` in DetailDialog already handles metadata merging, but we'll do a simpler direct merge here since we're only touching one key

## Files changed

| File | What |
|------|------|
| `src/components/WeightItemsTable.tsx` | Make calorie burn line tappable, show inline input(s) in edit mode, call new callback on save |
| `src/pages/WeightLog.tsx` | Add `handleUpdateCalorieBurn` callback that merges calories_burned into exercise_metadata and persists |

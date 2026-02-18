

# Put calorie burn label and input on the same row

## Problem

When editing mode is active, "Calories burned:" appears as a separate `<p>` tag above the input, wasting vertical space. The user wants label and input on the same line.

## Change

### `src/components/CalorieBurnInline.tsx`

For single-exercise entries (the common case), remove the separate label paragraph and instead pass a `name` of `"Calories burned"` to the `CalorieBurnInput` component so it renders inline using the existing flex row layout.

For multi-exercise entries, keep the current stacked layout (label per exercise already renders inline).

Specifically, in the editing branch (lines 60-77):

- Remove the standalone `<p>` label
- For single-exercise entries: pass `name="Calories burned"` to `CalorieBurnInput` so the label appears in the same flex row as the input and "cal" suffix
- For multi-exercise entries: show exercise name labels as before (already inline)

The result will be a single row: `Calories burned: [__55__] cal`

## Files changed

| File | What |
|------|------|
| `src/components/CalorieBurnInline.tsx` | Remove separate label line, pass inline label to CalorieBurnInput for single-exercise case |


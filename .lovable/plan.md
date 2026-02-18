

# Fix "Save as routine/meal" alignment

## Problem
After the vertical stack refactor, "Save as routine" ended up centered with the right-aligned action links. The user wants it left-aligned, while "Copy to today" and "Details" stay right-aligned.

## Fix

### `src/components/EntryExpandedPanel.tsx`
- Split the single `flex justify-end gap-4` row into a `flex justify-between` row.
- Left side: "Save as routine/meal" (only shown when `!isFromSaved && onSaveAs`).
- Right side: "Copy to today" and "Details" grouped together in a nested `flex gap-4`.
- When there's no "Save as" link, the right-side links still align right via `justify-between` (or use `ml-auto` on the right group).

Result: "Save as routine" stays left, "Copy to today" and "Details" stay right, all on the same line.


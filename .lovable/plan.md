

# Fix DetailDialog: close button, category alignment, dropdown width, input alignment

## 1. Add X close button back to the dialog

Remove the `[&>button:last-child]:hidden` class from `DialogContent` on line 475. This re-enables the built-in Radix close button that was previously hidden.

## 2. Make category value position consistent between view and edit mode

Currently in view mode, the category label ("Other", "Cardio", "Strength") appears right after the Name value inline via `pairedField` rendering (line 161-164). In edit mode, it's a dropdown pinned to the right side of the Name row.

Fix: In `FieldViewGrid`, render the `pairedField` value in the same right-aligned position it occupies in edit mode -- as a separate element pushed to the right of the row, rather than immediately after the name text.

## 3. Make category dropdown same width as Subtype dropdown

The category dropdown currently uses `w-[7.5rem]` (line 268). The Subtype `<select>` uses `flex-1 min-w-0` (line 225). To make them line up in a column:

- Give select fields that appear in the right column a consistent fixed width matching the category dropdown
- The category paired-field select and the Subtype select should both use the same width class (e.g., `w-[7.5rem]`)

Since Exercise type and Subtype are both selects that appear as full-width in the grid's right column, they use `flex-1`. The category dropdown is a `pairedField` with `w-[7.5rem]`. The cleanest fix: make the category dropdown also `flex-1` within the remaining space, or give both a consistent width. Given the layout, the paired field select should match the width of selects below it. We can set select elements to a consistent width or let both flex. The simplest approach: remove the fixed `w-[7.5rem]` from the category select and let it flex-fill, same as the other selects do in their grid cells.

Actually, looking more carefully: the category dropdown sits on the Name row (a `col-span-2` text row), while Exercise type and Subtype are separate grid rows. They won't naturally align via the grid. The fix is to give the category paired-field select the same width behavior. Since the right column of the 2-col grid determines Subtype's width, and the category dropdown is on a `col-span-2` row, we need a fixed width on both. Set both to `w-[7.5rem]` and right-align them.

## 4. Left-align numeric input values instead of centered

Change `text-center` to `text-left` for numeric inputs on line 255:
```
"w-12 text-center"  -->  "w-12"
```
(Input defaults to left-aligned text.)

## Technical summary of edits (all in `src/components/DetailDialog.tsx`)

**Line 154-165 (FieldViewGrid paired field)**: Restructure the Name row so the paired field value renders right-aligned, matching the edit-mode dropdown position. Wrap the row content in a flex container that pushes the category value to the right.

**Line 225 (FieldEditGrid select)**: For the Subtype select specifically, apply a fixed width matching `w-[7.5rem]` instead of `flex-1` so it aligns with the category dropdown above it.

**Line 255 (FieldEditGrid number input)**: Remove `text-center` from numeric input className.

**Line 475 (DialogContent)**: Remove `[&>button:last-child]:hidden` to show the X close button.


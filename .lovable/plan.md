

# Fix category dropdown clipping, alignment, and view-mode positioning

## 1. Fix dropdown clipping (category select and name input focus ring)

The dialog content has `overflow-y-auto` on the scrollable area (line 479), which clips any content that extends outside its bounds -- including the focus ring on the Name input and the native `<select>` dropdown popover.

**Fix:** Add `overflow: visible` (`overflow-visible`) to the grid container wrapping the fields in edit mode, and ensure the dialog scrollable area uses `overflow: clip` only on the y-axis, not both. Actually, the real fix is simpler: add vertical padding to the grid rows so the focus ring (2px ring + 2px offset = 4px) is not clipped. Add `py-0.5` to the edit grid container rows.

Wait -- the focus ring clipping on the Name row is because the grid container itself is fine, but the `overflow-y-auto` on the parent `div.flex-1` (line 479) clips the ring. The simplest fix is to add a small `py-1` to the edit grid container so the top/bottom rings have room.

For the native `<select>` dropdown: native `<select>` dropdowns render as OS-level popups and should NOT be clipped by CSS overflow. The screenshot shows a Chrome autofill popup, not the select dropdown being clipped. That "Saved info" popup is a browser autofill feature on the Name text input, not related to the category select. The category dropdown itself (native select) works fine.

Re-examining screenshot 1: the category dropdown IS rendering correctly (Strength/Cardio options visible). The clipping mentioned is likely the focus ring on the Name input. Add `py-1` padding to the scrollable content area to prevent ring clipping.

**Changes in `src/components/DetailDialog.tsx`:**
- Line 479: Change `<div className="flex-1 overflow-y-auto px-4 pb-2">` to `<div className="flex-1 overflow-y-auto px-4 py-2">` (add top padding so focus ring on first row isn't clipped)

## 2. Align category dropdown with subtype dropdown

Currently the category select sits right after the Name input with no defined left-edge alignment relative to the Subtype dropdown below. The Name input uses `flex-1` and the category uses `w-[90px]`. The subtype dropdown also sits inline after its label.

The fix: give the paired category dropdown the same width as the subtype select, and ensure they align by making the Name input stop at the same point the Exercise type select starts (i.e., the category and subtype dropdowns should have the same width and both be right-aligned in the row).

Looking at the layout: Exercise type row has label + flex-1 select. Subtype row has label + flex-1 select. Name row has label + flex-1 input + 90px category. The issue is the category dropdown needs to start where the subtype dropdown starts.

The simplest approach: give the Name input a fixed max-width so the category dropdown occupies the same horizontal space as the subtype field (label + dropdown). Since the subtype row has "Subtype:" label (~55px) + gap (8px) + flex select, the category dropdown should be roughly that same width.

Actually, the cleanest approach: put the category dropdown in a fixed-width container that matches the subtype column width. Since the grid is `grid-cols-2`, and the Name row spans both columns (`col-span-2`), the category dropdown should occupy roughly one column's worth of space minus some. But actually the layout isn't using the grid for Name -- it uses `col-span-2` with flex.

Better approach: Set the category select width to match typical right-column content. The right column includes "Subtype:" label + select. Give the category select a width like `w-[120px]` or use a wrapper that includes a "Category:" micro-label.

Simplest fix that achieves visual alignment: make the paired category `<select>` the same width as the subtype select would be in that column. Looking at the grid, each column is roughly half the dialog width. The Name takes col-span-2. If we make the category dropdown ~120px, it should roughly line up with where Subtype's dropdown starts.

**Changes in `src/components/DetailDialog.tsx`:**
- Line 267: Change category select from `w-[90px]` to `w-[7.5rem]` (120px), which better matches the subtype dropdown width

## 3. Fix view-mode category text positioning

In view mode, the category text ("Strength" or "Cardio") shows as `ml-auto` which pushes it to the far right of the row. In edit mode, it sits right after the Name input. This causes a visual jump.

**Fix:** Instead of `ml-auto`, position the category text so it aligns with where the dropdown would be in edit mode. Remove `ml-auto` and use a fixed positioning approach: give the Name value text a flex-1 and the category text a fixed width matching the edit dropdown width.

**Changes in `src/components/DetailDialog.tsx`:**
- Lines 161-165: In `FieldViewGrid`, for the paired field rendering, replace `ml-auto` with a fixed width wrapper matching the edit-mode dropdown width (`w-[7.5rem]`), and add `pl-2` padding to match the input text alignment, plus `text-right` or keep left-aligned to match where dropdown text sits.

Actually, the dropdown text in a `<select>` is left-aligned within the box. So the view-mode text should also be left-aligned within that same width box. Use `w-[7.5rem] text-sm pl-2` to match the padding of the select element.

**Changes:**
```tsx
// Line 161-164: Replace ml-auto with fixed width to match edit dropdown
{field.pairedField && (
  <span className="text-sm shrink-0 w-[7.5rem] pl-2">
    {displayValue(field.pairedField, activeValues)}
  </span>
)}
```

## Summary of file changes

**`src/components/DetailDialog.tsx`:**

1. Line 479: `px-4 pb-2` -> `px-4 py-2` (add top padding to prevent focus ring clipping)
2. Lines 161-164: Change paired field view from `ml-auto text-xs text-muted-foreground` to `w-[7.5rem] text-sm pl-2` to match edit-mode dropdown position
3. Line 267: Change category select width from `w-[90px]` to `w-[7.5rem]` to align with subtype dropdown below


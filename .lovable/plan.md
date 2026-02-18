

# Fix exercise detail layout properly with CSS Grid best practices

## Root cause

Every label has `min-w-[6rem]` (96px). With two columns, that's 192px of non-negotiable label width before inputs, gaps, or unit toggles get any space. The `fr`-based grid ratios are meaningless when the content's minimum width exceeds the container -- the grid overflows and the browser compensates by expanding the left column disproportionately.

## Solution

Remove `min-w-[6rem]` from all labels in both `FieldViewGrid` and `FieldEditGrid`. Labels are short text ("Effort", "Speed", "Cal Burned") that don't need a forced minimum -- `shrink-0` already prevents them from compressing. Without the minimum, CSS Grid's `fr` units will actually control column proportions as intended.

Also reduce `gap-x-6` (24px) to `gap-x-4` (16px) -- 24px between columns is generous for a mobile dialog and reclaims space for content.

## Changes

**`src/components/DetailDialog.tsx`**

1. Line 138: `gap-x-6` to `gap-x-4`
2. Line 147: Remove `min-w-[6rem]` from the view-mode label span
3. Line 181: `gap-x-6` to `gap-x-4`
4. Line 184: Remove `min-w-[6rem]` from the edit-mode label span

Four small edits, all in the same file. The `gridClassName` prop and `grid-cols-[6fr_5fr]` ratio from WeightLog.tsx will now actually work as intended.

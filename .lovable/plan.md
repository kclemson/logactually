

# Minimize layout shift by shrinking edit-mode inputs to match read-only row height

## Goal

Keep the compact read-only layout as-is. Instead, reduce the height and spacing of edit-mode inputs so fields stay in the same position when toggling between view and edit.

## What changes

All changes in `src/components/DetailDialog.tsx`:

### 1. Shrink edit-mode inputs from h-8 to h-6

The `Input` elements in `FieldEditGrid` currently use `className="h-8 text-sm flex-1 min-w-0"`. Change to `h-6 py-0 px-1.5 text-sm flex-1 min-w-0` -- this makes each input 24px tall (matching the ~24px read-only rows) by removing the internal vertical padding.

### 2. Shrink edit-mode selects from h-8 to h-6

The `<select>` elements use `h-8 ... px-2 py-1`. Change to `h-6 py-0 px-1.5` to match.

### 3. Reduce edit grid row gap from gap-y-1.5 to gap-y-0.5

This matches the read-only grid's `gap-y-0.5`, so the spacing between rows is identical in both modes.

### 4. Match read-only row height explicitly

Add `items-center` to the read-only row div (it already has `flex gap-2 py-0.5`) so vertical alignment matches the edit rows.

## Result

Fields that appear in both modes will occupy the same vertical position. The only layout shifts will come from fields that are hidden in read-only mode (via `hideWhenZero`) appearing when entering edit mode -- which is unavoidable and expected.

## Technical details

**FieldEditGrid grid container (line 129):**
`gap-y-1.5` becomes `gap-y-0.5`

**FieldEditGrid select (line 141):**
`h-8` becomes `h-6`, `px-2 py-1` becomes `px-1.5 py-0`

**FieldEditGrid Input (around line 160, the Input element):**
`h-8` becomes `h-6`, add `py-0 px-1.5`

**FieldViewGrid row div (line 103):**
Add `items-center` to match edit-mode alignment

| File | Change |
|------|--------|
| `src/components/DetailDialog.tsx` | Shrink edit inputs/selects to h-6, reduce edit gap-y to 0.5, add items-center to view rows |


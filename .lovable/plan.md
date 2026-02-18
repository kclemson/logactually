

# Align exercise detail inputs into clean columns

## Problem

Currently each grid cell uses `flex gap-2`, which means the input's x-position depends on its specific label's text width. "Distance:" is shorter than "Exercise type:", so the Distance input starts further left. There's no vertical alignment of inputs within a column.

## Fix (two changes)

### 1. Consistent label width via `labelClassName` prop

Add a `labelClassName` prop that flows from DetailDialog down to FieldViewGrid and FieldEditGrid. For exercise dialogs, WeightLog.tsx passes `labelClassName="min-w-[5.5rem]"` -- wide enough for the longest label ("Exercise type:"). This forces all labels in the grid to occupy at least that width, so every input's left edge starts at the same x-position within its column.

Food dialogs don't pass `labelClassName`, so they're unaffected.

### 2. Shrink numeric inputs from `w-16` to `w-12`

`w-16` (64px) is wider than needed for values that are at most 3-4 characters. `w-12` (48px) fits "1.19", "171", "108" comfortably and looks much tighter.

## Technical changes

**`src/components/DetailDialog.tsx`**

- Add `labelClassName?: string` to `DetailDialogProps` interface
- Pass it through to `FieldViewGrid` and `FieldEditGrid` (both accept it as a new optional prop)
- Apply it to the label `<span>` via `cn("text-xs text-muted-foreground shrink-0", labelClassName)`
- Change numeric input width from `w-16` to `w-12`

**`src/pages/WeightLog.tsx`**

- Add `labelClassName="min-w-[5.5rem]"` to both exercise DetailDialog usages (lines 774 and 796 area)

Four small edits total: prop threading + label class + input width + caller prop.


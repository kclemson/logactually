

# DetailDialog UX refinements

Six changes, all within `src/components/DetailDialog.tsx` (plus minor field config updates in the same file).

## 1. Multi-item mode: don't expand first item by default

Change the default `expandedIndices` from `new Set([0])` to `new Set()` (empty). Also update the reset in `handleOpenChange` to use empty set.

## 2. Edit mode: inline label + input on the same row

Replace the current stacked layout (label above, input below) with a horizontal row: label on the left with a colon, input on the right. This applies to both number and text fields in `FieldEditGrid`.

Current structure per field:
```text
Label (unit)
[  input  ]
```

New structure:
```text
Label:    [  input  ]
```

For the 2-column grid of number fields, each cell becomes a flex row with `label: input` side by side. Text fields (full-width) use the same pattern. Select fields get the same treatment.

## 3. Single-item mode: hide the dialog title header

When in single-item mode, the `DialogHeader` with the title is redundant (the "Name" field shows the same value). Conditionally render the header only in multi-item mode.

For single-item mode, still render a minimal header area for the close button spacing, but omit the `DialogTitle` text. Use a `DialogTitle` with `sr-only` class (for accessibility, Radix requires it) or visually hide it.

## 4. Read-only values: left-aligned instead of right-aligned

In `FieldViewGrid`, change the value `<span>` from `text-right` to left-aligned. Remove `justify-between` from the row and instead use a fixed-width label column so values line up. The simplest approach: keep the flex row but remove `justify-between`, add a gap, and let the value sit naturally after the label.

## 5. Exercise read-only: hide null metadata fields

Extend the `hideWhenZero` concept to also hide fields where the value is null/undefined/dash. Currently `hideWhenZero` only checks for `0, null, undefined`. For exercise metadata fields, the values are null when not set. 

Add a new prop `hideWhenEmpty?: Set<string>` or simply broaden the existing filter in `FieldViewGrid` to also hide fields in `hideWhenZero` when value is empty string. Actually, the current filter already hides null/undefined -- the issue is that exercise metadata fields aren't in `hideWhenZero`. 

Solution: export `EXERCISE_HIDE_WHEN_EMPTY` set containing metadata field keys, and pass it as `hideWhenZero` from WeightLog. The existing filter logic already handles null/undefined.

## 6. Remove section headers, add separator line after "basic" fields

Remove section header rendering entirely from both `FieldViewGrid` and `FieldEditGrid`. Instead, render a thin `<hr>` between the first section and subsequent sections (i.e., after what was the "Basic" group).

---

## Technical details

### `FieldViewGrid` changes (lines 81-115)

- Remove section header `<h4>` rendering
- Add `<hr className="border-border/50 my-2" />` between first and second section group
- Change row from `flex justify-between` to `flex gap-2` with label taking fixed min-width
- Value span: remove `text-right`
- Extend filter: for fields in `hideWhenZero`, also treat `''` as empty (already handles 0/null/undefined)

### `FieldEditGrid` changes (lines 117-183)

- Remove section header `<h4>` rendering  
- Add `<hr>` separator between first and second section group
- Change each field from stacked (label block above, input below) to inline row: `flex items-center gap-2` with label as inline element, input flex-1
- Label gets a colon suffix
- For select fields, same inline layout

### Dialog header (lines 309-311)

- In single-item mode: render `DialogTitle` with `className="sr-only"` (visually hidden but accessible)
- In multi-item mode: render title normally as today

### Default expanded state (line 207)

- Change `new Set([0])` to `new Set()`
- Change reset on line 216 to `new Set()`

### Exercise field configs (lines 478-491)

- Create and export `EXERCISE_HIDE_WHEN_EMPTY` set with all metadata keys: `new Set(KNOWN_METADATA_KEYS.map(mk => \`_meta_\${mk.key}\`))`
- Pass from WeightLog as `hideWhenZero` prop

### Food/Exercise section labels (lines 408-420, 456-491)

- Remove `section` property from field configs entirely, OR keep them for grouping logic but just don't render headers
- Keep section grouping so the `<hr>` separator knows where to split -- first section vs rest

## Files changed

| File | Change |
|------|--------|
| `src/components/DetailDialog.tsx` | All 6 changes: default collapsed, inline edit layout, hidden single-item title, left-aligned values, hide empty metadata, remove section headers + add separator |
| `src/pages/WeightLog.tsx` | Pass `hideWhenZero={EXERCISE_HIDE_WHEN_EMPTY}` to DetailDialog for exercise entries |


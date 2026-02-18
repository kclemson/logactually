

# Fix: Add `min-w-0` to grid cells (the standard CSS Grid overflow fix)

## Root cause

CSS Grid items have `min-width: auto` by default. This means each grid cell's minimum width equals its content's intrinsic minimum width (label text + gap + value text). The `fr`-based column ratios are overridden whenever content is wider than the ratio allows -- the grid expands to fit, causing overflow.

This is a well-known CSS Grid pitfall documented everywhere (CSS Tricks, MDN, etc.). The fix is one class.

## Fix

Add `min-w-0` to each grid cell `div` in both `FieldViewGrid` and `FieldEditGrid`. This tells CSS Grid "this cell CAN shrink below its content width," allowing `fr` units to actually control column proportions.

Also add `min-w-0 truncate` to value spans in view mode so that long text (e.g., "Incline bench press") gets truncated with an ellipsis rather than forcing the column wider.

**File: `src/components/DetailDialog.tsx`**

### Change 1: FieldViewGrid cell div (line 146)

```
// Before
<div key={field.key} className={cn("flex items-center gap-2 py-0.5", field.type === 'text' && 'col-span-2')}>

// After
<div key={field.key} className={cn("flex items-center gap-2 py-0.5 min-w-0", field.type === 'text' && 'col-span-2')}>
```

### Change 2: FieldViewGrid value span (line 150)

```
// Before
<span className="text-sm">

// After
<span className="text-sm min-w-0 truncate">
```

### Change 3: FieldEditGrid cell div (line 186)

```
// Before
<div key={field.key} className={cn("flex items-center gap-2", field.type === 'text' && 'col-span-2')}>

// After
<div key={field.key} className={cn("flex items-center gap-2 min-w-0", field.type === 'text' && 'col-span-2')}>
```

### Change 4: Revert gridClassName to `grid-cols-2` in WeightLog.tsx (lines 774, 796)

With `min-w-0` in place, the `fr` units will actually work. But equal columns (`grid-cols-2`) is the right default -- all cells have the same structure (label + value), so equal widths make sense. The `6fr_5fr` hack was compensating for the overflow, not solving it.

That's it. Four small edits across two files. This is the standard, industry-practice fix for CSS Grid content overflow.

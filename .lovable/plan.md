

# Constrain Name field width to match Portion

## Problem

The Name input stretches edge-to-edge across the dialog, far wider than needed. The Portion field below it is already constrained to `max-w-[12rem]`, and the numeric fields below that are even narrower. The Name field should have a similar natural boundary.

## Fix

Add `maxWidth: 'sm'` to the Name field in `buildFoodDetailFields`, same as Portion already has. This applies the existing `max-w-[12rem]` constraint, aligning the Name input's right edge with the Portion input's right edge and creating a visually consistent left column.

## Technical details

**File: `src/components/DetailDialog.tsx`** -- `buildFoodDetailFields` (line 537)

```tsx
// Before
{ key: 'description', label: 'Name', type: 'text' },

// After
{ key: 'description', label: 'Name', type: 'text', maxWidth: 'sm' },
```

One line, one property addition.




# Compact, left-hugging inputs for exercise detail fields

## Concept

Instead of inputs stretching to fill available space (`flex-1`), make them a fixed small width (like the biometrics dialog). The label takes only the space it needs, and the input sits right next to it -- no push-right, no justify-between. The layout naturally aligns because all cells in a given grid column start at the same x-position.

## Changes

**File: `src/components/DetailDialog.tsx`**

### Edit mode inputs (line 225)

Change numeric `Input` from `flex-1 min-w-0` to a fixed width:

```
// Before
className="h-6 py-0 px-1.5 text-sm flex-1 min-w-0"

// After
className="h-6 py-0 px-1.5 text-sm w-16 text-center"
```

This gives every numeric input the same ~4-character width, matching the biometrics pattern.

### Select dropdowns (line 196)

Keep `flex-1` for selects since dropdown options need room:

```
// No change -- selects stay flex-1
```

### Text inputs (Name field)

The Name field already spans `col-span-2` -- it should also stay `flex-1` since it's a full-width text field. We need to differentiate: only `type === 'number'` inputs get the fixed width.

Updated logic (line 214-226):

```tsx
<Input
  type={field.type}
  ...
  className={cn(
    "h-6 py-0 px-1.5 text-sm",
    field.type === 'number' ? "w-16 text-center" : "flex-1 min-w-0"
  )}
/>
```

That's it -- one line change (swapping the className to be conditional on field type). Labels stay left, inputs sit snugly next to them at a compact fixed width, and the grid columns handle vertical alignment naturally.


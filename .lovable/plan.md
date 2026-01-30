

## Fix Outline Animation Clipping Text

### Problem

The new-entry highlight animation uses `inset box-shadow` with a 2px border. Since `inset` shadows render *inside* the element, the 2px shadow overlaps the text content which only has `pl-1` (4px) left padding - leaving only 2px of clearance.

### Solution

Add left padding to the animated row container to create space for the inset shadow. The fix should only apply when the animation is active to avoid affecting the normal layout.

---

### Changes

#### `src/components/FoodItemsTable.tsx`

Add `pl-0.5` (2px) padding to rows when they have the outline animation:

```tsx
// Current (line ~400-408):
<div
  className={cn(
    'grid gap-0.5 items-center group',
    gridCols,
    entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
    entryIsNew && !isFirstInEntry && isLastInEntry && "rounded-b-md animate-outline-fade-bottom",
    entryIsNew && !isFirstInEntry && !isLastInEntry && "animate-outline-fade-middle",
    entryIsNew && isFirstInEntry && isLastInEntry && "rounded-md animate-outline-fade"
  )}
>

// Updated:
<div
  className={cn(
    'grid gap-0.5 items-center group',
    gridCols,
    entryIsNew && "pl-0.5",  // Add left padding for inset shadow
    entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
    // ... rest unchanged
  )}
>
```

#### `src/components/WeightItemsTable.tsx`

Apply the same fix for consistency:

```tsx
// Add to the row className:
entryIsNew && "pl-0.5",
```

---

### Why This Works

- `pl-0.5` adds 2px of left padding
- Combined with existing `pl-1` (4px) on the text = 6px total clearance
- The 2px inset shadow now has proper space and won't overlap text
- The padding only applies when `entryIsNew` is true, so normal rows are unaffected

---

### Summary

| File | Change |
|------|--------|
| `FoodItemsTable.tsx` | Add `pl-0.5` to row when `entryIsNew` |
| `WeightItemsTable.tsx` | Add `pl-0.5` to row when `entryIsNew` |


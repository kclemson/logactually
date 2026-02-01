

## Fix Blue Outline Clipping Text on Multi-Line Rows

The blue outline (inset box-shadow) for new entries clips the bottom of text when the description + portion wraps to two lines.

---

### Problem Analysis

The grid row uses an `inset box-shadow` of 2px to create the blue outline:

```typescript
// tailwind.config.ts keyframes
"outline-fade-bottom": {
  "0%, 80%": {
    boxShadow: "inset 2px -2px 0 0 hsl(217 91% 60%), inset -2px 0 0 0 hsl(217 91% 60%)",
  },
  ...
}
```

The row already adds `pl-0.5` (2px left padding) when the entry is new, to prevent the left shadow from overlapping content. However, there's no corresponding bottom padding for the bottom shadow, so when text wraps to a second line, the 2px bottom border cuts through the bottom of the text.

---

### Solution

Add `pb-0.5` (2px bottom padding) when the entry is new AND is the last row in the entry (where the bottom border appears).

---

### File Change

**`src/components/FoodItemsTable.tsx`** - Lines 399-409:

```typescript
// Before
className={cn(
  'grid gap-0.5 items-center group',
  gridCols,
  // Add left padding for inset shadow when entry is new
  entryIsNew && "pl-0.5",
  // Grouped highlight: apply segmented outline to create connected visual
  entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
  entryIsNew && !isFirstInEntry && isLastInEntry && "rounded-b-md animate-outline-fade-bottom",
  entryIsNew && !isFirstInEntry && !isLastInEntry && "animate-outline-fade-middle",
  entryIsNew && isFirstInEntry && isLastInEntry && "rounded-md animate-outline-fade"
)}

// After
className={cn(
  'grid gap-0.5 items-center group',
  gridCols,
  // Add padding for inset shadow when entry is new
  entryIsNew && "pl-0.5",
  entryIsNew && isLastInEntry && "pb-0.5",  // Bottom padding for bottom border
  // Grouped highlight: apply segmented outline to create connected visual
  entryIsNew && isFirstInEntry && !isLastInEntry && "rounded-t-md animate-outline-fade-top",
  entryIsNew && !isFirstInEntry && isLastInEntry && "rounded-b-md animate-outline-fade-bottom",
  entryIsNew && !isFirstInEntry && !isLastInEntry && "animate-outline-fade-middle",
  entryIsNew && isFirstInEntry && isLastInEntry && "rounded-md animate-outline-fade"
)}
```

---

### Same Fix for WeightItemsTable

**`src/components/WeightItemsTable.tsx`** - Apply the same pattern (add `pb-0.5` for bottom rows of new entries).

---

### Summary

| File | Change |
|------|--------|
| `FoodItemsTable.tsx` | Add `entryIsNew && isLastInEntry && "pb-0.5"` to the grid row className |
| `WeightItemsTable.tsx` | Same change for consistency |

This ensures the 2px inset shadow at the bottom has 2px of breathing room, preventing it from clipping through wrapped text.


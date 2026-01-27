

## Make Expansion Chevron Larger and More Touch-Friendly

### Problem

The `›` chevron that expands food entries is too small to see and tap easily on mobile devices. While the touch target is 44px wide, the visual chevron character is very small.

### Solution

Increase the chevron's visual size by adding explicit font sizing. The current implementation uses a Unicode character which inherits the default (small) text size.

### Changes

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `text-xl` class to make the chevron character larger and more visible |

### Implementation Details

There are **two identical chevron buttons** in the file (one for editable mode, one for read-only mode). Both need to be updated:

**Lines 347-355** (editable mode) and **Lines 392-401** (read-only mode):

Update the button className from:
```tsx
className={cn(
  "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform",
  isCurrentExpanded && "rotate-90"
)}
```

To:
```tsx
className={cn(
  "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl",
  isCurrentExpanded && "rotate-90"
)}
```

### Result

- The `›` character will be ~20px tall instead of ~14px (the default)
- Much easier to see on mobile screens
- Touch target remains the same 44px (already accessibility-compliant)
- Maintains the existing rotation animation when expanded




## Add Bold to Section Headers in CollapsibleSection

### Problem

The CollapsibleSection component's title text lacks `font-medium`, so section headers appear with normal weight instead of being bold. This makes it harder to visually distinguish section headers from body text.

### Fix

Update `src/components/CollapsibleSection.tsx` line 63 to add `font-medium` to the button's className:

**Current:**
```tsx
className="flex items-center gap-2 text-heading text-muted-foreground hover:text-foreground transition-colors"
```

**Updated:**
```tsx
className="flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground transition-colors"
```

This adds bold weight to all CollapsibleSection headers (including on Privacy page, Settings, and anywhere else the component is used), while keeping the muted color and hover effect.

### Result

Section headers like "What Data Is Collected", "Your Data, Your Control", etc. will be bold, clearly distinguishing them from the bullet point content beneath.


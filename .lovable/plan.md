

## Change "Add" Button Font Color

### Problem
The current `text-muted-foreground` class makes the buttons appear too subtle/passive.

### Solution
Change the text color to `text-foreground` (or optionally `text-primary` for a blue accent) so the buttons are clearly visible while maintaining the minimal, outline-free style.

### Changes

**File: `src/pages/Settings.tsx`**

**Line 154** (Saved Meals button):
```tsx
// Change from:
className="... text-sm text-muted-foreground hover:text-foreground"

// To:
className="... text-sm text-foreground"
```

**Line 195** (Saved Routines button):
Same change.

### Color Options

- **`text-foreground`** - Standard text color, matches other content
- **`text-primary`** - Blue accent color, signals it's an action (like a link)

### Technical Details

- Removes the `text-muted-foreground` class
- Removes `hover:text-foreground` since it's no longer needed
- Keeps all other styling (full-width, hover background, icon + label layout)


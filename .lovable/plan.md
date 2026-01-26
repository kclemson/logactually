

## Admin Page Compact Layout

### Overview
Make the admin stats section more compact by reducing padding and gaps to fit sub-stats on single lines without wrapping.

---

### Changes

**File: `src/pages/Admin.tsx`**

#### Change 1: Reduce container padding (line 45)

Current:
```tsx
<div className="p-4 space-y-3">
```

New:
```tsx
<div className="px-1 py-2 space-y-2">
```

This reduces:
- Horizontal padding from 16px to 4px (combined with Layout's 12px = minimal edge margin)
- Vertical padding from 16px to 8px
- Vertical spacing between sections from 12px to 8px

#### Change 2: Reduce grid gap (lines 47 and 54)

Current:
```tsx
<div className="grid grid-cols-3 gap-2 text-muted-foreground text-xs">
```

New:
```tsx
<div className="grid grid-cols-3 gap-1 text-muted-foreground text-xs">
```

This reduces the gap between the 3 columns from 8px to 4px, giving more room for text.

#### Change 3: Reduce vertical spacing in sub-stat columns (lines 56, 69, 75)

Current:
```tsx
<div className="space-y-0.5">
```

New:
```tsx
<div className="space-y-0">
```

This removes the 2px vertical gap between sub-stat lines.

---

### Summary

| Element | Before | After |
|---------|--------|-------|
| Container horizontal padding | `p-4` (16px) | `px-1` (4px) |
| Container vertical padding | `p-4` (16px) | `py-2` (8px) |
| Section spacing | `space-y-3` (12px) | `space-y-2` (8px) |
| Grid column gap | `gap-2` (8px) | `gap-1` (4px) |
| Sub-stat line spacing | `space-y-0.5` (2px) | `space-y-0` (0px) |

---

### Result
- More horizontal space for text, reducing line wrapping
- Tighter overall layout for quick scanning
- Minimal margins from viewport edge (Layout's 12px + Admin's 4px = 16px total)


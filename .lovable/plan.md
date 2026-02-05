

## Fix: Add flex-wrap for Multi-Image Changelog

### Change

**`src/pages/Changelog.tsx` line 78:**

```tsx
// Before
<div className="flex gap-2 mt-2">

// After  
<div className="flex flex-wrap gap-2 mt-2">
```

### Why This Works

- `flex-wrap` allows flex items to wrap to the next line when they exceed container width
- Images will stay side-by-side on desktop (both fit)
- On mobile, the second image wraps below the first automatically
- No breakpoint logic or responsive prefixes needed

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Changelog.tsx` | Add `flex-wrap` to multi-image container class |


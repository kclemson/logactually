

## Fix Changelog Image Aspect Ratio and Height

### Problem
The changelog image is being squished (aspect ratio not preserved) and should have a smaller max height of 150px instead of 256px.

### Changes

**File: `src/pages/Changelog.tsx`**

Update the image className (line 69):

Current:
```tsx
className="mt-2 rounded-lg border border-border max-h-64 w-auto"
```

New:
```tsx
className="mt-2 rounded-lg border border-border max-h-[150px] w-auto object-contain"
```

Changes:
- `max-h-64` → `max-h-[150px]`: Reduces max height from 256px to 150px
- Add `object-contain`: Preserves aspect ratio within the constrained dimensions

### Result
- Image will maintain its original aspect ratio (no squishing)
- Max height capped at 150px for a more compact changelog


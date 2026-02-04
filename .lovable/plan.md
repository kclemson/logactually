

## Fix Changelog Image Styling

### Problems
1. Image is centered (should be left-aligned)
2. Image has a border/box around it (user doesn't want this)
3. Height of 150px is too small - user wants 200px

### Changes

**File: `src/pages/Changelog.tsx`** (line 72)

Update the image className:

Current:
```tsx
className="mt-2 rounded-lg border border-border max-h-[150px] w-auto object-contain"
```

New:
```tsx
className="mt-2 rounded-lg max-h-[200px] w-auto object-contain"
```

Changes:
- Remove `border border-border`: Removes the box/border around the image
- `max-h-[150px]` → `max-h-[200px]`: Increases max height to 200px
- Keep `w-auto object-contain`: Preserves aspect ratio
- Keep `rounded-lg`: Subtle rounding on image corners

The image will naturally left-align within the flex container since there's no centering applied - the border removal should fix the visual "box" issue, and the flex-col container already left-aligns its children by default.

### Result
- Image left-aligned with text (no centering)
- No border/box around the image
- Max height of 200px with preserved aspect ratio


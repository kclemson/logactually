

# Remove rounded corners from changelog screenshots

## Problem
The changelog page applies `rounded` corners to screenshots via CSS. Since the user uploads square-cornered screenshots (sometimes with white outlines for contrast), the rounding clips those edges.

## Fix

### `src/pages/Changelog.tsx`
Remove the `rounded` class from three places:

1. **Lightbox image** (line ~134): Remove `rounded` from the `<img>` inside the lightbox overlay.
2. **Lightbox container** (line ~127): Remove `rounded-lg` from the lightbox wrapper `<div>` so it doesn't add rounded padding around a square image.

The inline thumbnail images in the list don't appear to have `rounded` classes, so no change needed there.

One file, CSS-only change. No logic changes.


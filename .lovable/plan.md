

## Add Lightbox Photo Viewer to Changelog

### What it does

Clicking/tapping a changelog image opens a full-screen overlay showing the image at its natural size. Clicking the overlay background or an X button closes it. No dependencies needed -- just a simple React state + portal approach.

### Implementation

**File: `src/pages/Changelog.tsx`**

1. Add state to track which image is currently open: `const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)`

2. Make all changelog `<img>` elements clickable by adding `onClick={() => setLightboxSrc(src)}` and `cursor-pointer` styling.

3. Render a lightbox overlay when `lightboxSrc` is set:
   - Fixed full-screen backdrop (`fixed inset-0 z-50 bg-black/90`)
   - Centered image with `max-w-[90vw] max-h-[90vh] object-contain`
   - X button in top-right corner to close
   - Click on backdrop also closes
   - Stop propagation on image click so clicking the image itself doesn't close

This keeps it minimal -- no extra components or libraries. Works on both mobile and desktop.


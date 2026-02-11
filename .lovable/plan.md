

## Fix Changelog Lightbox: Add Escape Key and Constrain Size

### Problems
1. The lightbox overlay cannot be closed with the Escape key -- it's a plain `div`, not a Radix Dialog, so there's no built-in keyboard handling.
2. The black backdrop spans the full viewport making the X button hard to spot, and the image floats without a visible bounded container.

### Changes

**File: `src/pages/Changelog.tsx`**

1. **Add Escape key handler**: Add a `useEffect` that listens for `keydown` when `lightboxSrc` is set, calling `setLightboxSrc(null)` on Escape. Cleanup removes the listener. (This is an appropriate useEffect -- subscribing to a browser event.)

2. **Constrain the lightbox container**: Wrap the image in a card-like container (e.g., `max-w-3xl` with `bg-background rounded-lg p-2`) so the image feels bounded and the close button is visually anchored to the container rather than floating at the viewport edge.

3. **Move the X button** onto the container (top-right corner of the card) instead of the viewport corner, so it's always visible near the image.

### Technical detail

```tsx
// 1. Escape key (add near other hooks at top of component)
useEffect(() => {
  if (!lightboxSrc) return;
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxSrc(null);
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [lightboxSrc]);

// 2-3. Replace the lightbox markup with a bounded container:
{lightboxSrc && (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
    onClick={() => setLightboxSrc(null)}
  >
    <div
      className="relative max-w-3xl w-auto mx-4 bg-background rounded-lg p-2"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="absolute -top-3 -right-3 bg-background rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-md"
        onClick={() => setLightboxSrc(null)}
        aria-label="Close image"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={lightboxSrc}
        alt="Enlarged screenshot"
        className="max-h-[85vh] w-auto object-contain rounded"
      />
    </div>
  </div>
)}
```

This gives a visible card boundary around the image, a discoverable close button, and Escape key support. Mobile remains unaffected since the container simply scales down.

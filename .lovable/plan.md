
## Match the changelog lightbox pattern: X button hugs the image corner

### What needs to change

In `FeedbackForm.tsx`, the lightbox close button is positioned at `top-4 right-4` on the full-screen `fixed` overlay — meaning it floats in the top-right corner of the screen, far from the image.

The Changelog lightbox wraps the image in an inner `relative` div, then positions the X at `-top-3 -right-3` on that wrapper, so the button sits directly at the image's top-right corner. That's the pattern to match.

### Current lightbox structure (FeedbackForm)

```
fixed inset-0 overlay
  <button absolute top-4 right-4>  ← far from image
  <img>
```

### Target lightbox structure (Changelog)

```
fixed inset-0 overlay
  <div relative>  ← wraps just the image
    <button absolute -top-3 -right-3>  ← hugs the image corner
    <img>
  </div>
```

### Implementation

**`src/components/FeedbackForm.tsx`** — lightbox section (around lines 343–360):

1. Inside the fixed overlay `<div>`, add an inner `<div className="relative">` wrapping the image.
2. Move the `<button>` inside that wrapper and change its classes to match the changelog exactly:
   - Position: `absolute -top-3 -right-3`
   - Style: `bg-background rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors shadow-md`
3. Remove `e.stopPropagation()` from the image (since the button is now separate from the backdrop click zone) — the inner div should stop propagation to prevent the backdrop click from firing when clicking the image.
4. Add `onClick={(e) => e.stopPropagation()}` to the inner `<div>` wrapper so clicking the image area doesn't close the lightbox.

Also add an Escape key handler (matching the changelog) for keyboard accessibility.

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | Restructure lightbox to use inner relative wrapper with `-top-3 -right-3` X button, add Escape key handler |

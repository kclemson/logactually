
## Add click-to-enlarge for the screenshot thumbnail

### What's happening

The thumbnail in `FeedbackForm.tsx` (lines 306-323) is a plain `<img>` — there's no click handler or link on it, so users can't inspect what was captured.

### The fix: a simple lightbox overlay

When the user clicks the thumbnail, show a full-screen overlay with the image centred inside it. Clicking the overlay (or an X button) dismisses it. No new dependencies needed — just a conditional render using a `lightboxOpen` boolean state variable.

### Implementation details

**`src/components/FeedbackForm.tsx`**

1. Add `const [lightboxOpen, setLightboxOpen] = useState(false)` to the component state.

2. Wrap the `<img>` in a `<button>` (or make it `cursor-pointer`) that sets `lightboxOpen(true)` on click.

3. Render the lightbox conditionally: a fixed full-screen backdrop (`fixed inset-0 z-50 bg-black/80 flex items-center justify-center`) that closes on backdrop click, containing:
   - The full image (`max-w-[90vw] max-h-[85vh] object-contain rounded`)
   - An X close button in the top-right corner

4. Close lightbox when the attachment is cleared (call `setLightboxOpen(false)` inside `clearAttachment`).

### Files changed

| File | Change |
|---|---|
| `src/components/FeedbackForm.tsx` | Add `lightboxOpen` state, make thumbnail clickable, render a full-screen overlay |

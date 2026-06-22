## Make the Ken Burns effect more noticeable

The memory viewer's Ken Burns motion is too subtle to perceive. Two factors cause this: the zoom is tiny (`scale(1.12)`), and the per-photo drift offsets are tiny (~1.5–2%), spread across a long `25s` loop. We'll increase the zoom and drift magnitudes and modestly shorten the loop so the motion reads clearly without becoming distracting.

### Changes

**`src/index.css`** — strengthen the zoom and speed of the `.kenburns` animation:
- In `@keyframes kenburns`, bump the end scale from `1.12` to roughly `1.25` so the push-in is clearly visible.
- Reduce the animation duration from `25s` to about `18s` so the motion is perceptible within a single view of a photo.
- Leave the `prefers-reduced-motion` disable rule untouched.

**`src/pages/MemoryViewer.tsx`** — increase the drift in `KEN_BURNS_PRESETS`:
- Roughly double the `tx`/`ty` offsets (e.g. `±2%` → `±4–5%`, `±1.5%` → `±3%`) so the pan/drift accompanying the zoom is noticeable. Keep the center "push-in" preset at `0%/0%` (its motion comes purely from the stronger zoom). Keep the deterministic per-id selection so each photo still animates consistently.

### Notes / tradeoffs
- A larger zoom (`1.25`) means more of the image edges are cropped at the end of the loop. The frame is already `overflow-hidden` and portrait media uses `object-cover`, so this is safe; letterboxed (contain) photos simply crop slightly more inward at peak zoom, which is the intended Ken Burns look.
- These are the two tunable knobs (zoom scale + drift %, plus duration). If after seeing it you want it stronger or gentler, we can nudge `scale` and the drift percentages further.

### Verification
Open a memory in the immersive viewer in the preview and confirm the zoom/drift is now clearly visible within the first several seconds, and that no blank edges appear at peak zoom.
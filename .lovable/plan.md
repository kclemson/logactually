# Make the Ken Burns effect more pronounced

The effect feels subtle because the zoom is small (`scale(1.25)`) and stretched across a slow 18s loop, so motion-per-second is tiny. I'll increase the zoom magnitude, widen the per-photo drift, and modestly shorten the loop so movement is clearly perceptible — without becoming jarring or revealing blank edges.

## Changes

### `src/index.css`
- Increase the keyframe end zoom from `scale(1.25)` to `scale(1.45)` (more visible push-in; the extra scale also keeps drift edges covered).
- Shorten the loop from `18s` to `14s` so the same travel happens faster and reads as motion.
- Keep `ease-in-out infinite alternate` (smooth, never snaps) and keep the reduced-motion disable intact.

### `src/pages/MemoryViewer.tsx`
- Widen the `KEN_BURNS_PRESETS` drift amounts so panning is more apparent while staying within the larger zoom margin (no blank edges):
  - up-left / down-right: `~7%` / `~5.5%`
  - left: `~8%`
  - up: `~7%`
  - down-left: `~5.5%`
  - keep one pure push-in (center, `0%`) for variety.

## Why these values
At `scale(1.45)` the image is 45% larger than the frame, leaving ample margin so drifts up to ~8% never expose edges. Dropping to 14s raises the visible speed by ~30%. Together the zoom + pan become clearly noticeable while still feeling like a slow, cinematic Ken Burns drift rather than a fast animation.

## Verification
- Open a memory in the viewer and confirm photos now visibly zoom and pan, with different photos drifting in different directions, and no blank/letterbox edges appearing mid-animation.
- Confirm `prefers-reduced-motion` still fully disables the animation.

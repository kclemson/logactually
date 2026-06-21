# Ken Burns auto-motion for scrapbook photos (v2 "Cinematic")

Give photos in the immersive viewer a slow, looping zoom-and-pan so each memory feels alive on its own — using the **v2** feel: scale ~100% → 112%, ~25s loop, ease-in-out, seamless mirror reverse, with a gentle drift that varies per photo.

## Scope

- **Viewer only** (`src/pages/MemoryViewer.tsx`, the `MediaSlide` component).
- **All photos, regardless of aspect ratio.** Both full-bleed (`cover`) and letterboxed (`contain`) photos animate. Scaling a `contain` photo crops inward into the photo (the `overflow-hidden` frame clips it) and shrinks the letterbox bars — no blank edges are ever revealed, and any remaining gap shows the existing blurred backdrop. This keeps a mixed-aspect-ratio memory visually consistent.
- **Videos unchanged** for now (muted-autoplay pass comes later).
- Respect **reduced-motion**: no animation when the OS setting is on.

## Behavior

- The photo continuously scales between **1.0 and ~1.12** over **~25s**, `ease: 'easeInOut'`, `repeat: Infinity`, `repeatType: 'mirror'` so the loop reverses smoothly and never snaps.
- Alongside the zoom, a small **pan of ~1.5–2%** and a chosen **transform-origin**, both **varied per photo** so a multi-photo memory doesn't repeat. The variant is picked deterministically from the media id (a tiny hash → one of ~6 presets: push-in centered, drift up-left, drift down-right, drift left, drift up, drift down-left). Deterministic so the same photo always animates the same way across visits.
- Motion lives on the **image layer**; the outer slide transition, gradient scrim, caption, pills, and action bar are untouched and stay static/legible. The blurred backdrop stays still (it's blurred and largely covered, so its stillness isn't noticeable).

## Technical details (`src/pages/MemoryViewer.tsx`)

- Add a small module-level helper: `kenBurnsVariant(id: string)` → returns `{ origin, fromX, fromY, toX, toY }` from a deterministic hash of the id, selecting from a fixed preset array.
- In `MediaSlide`:
  - Import `useReducedMotion` from `framer-motion` (already a dependency); compute `const reduce = useReducedMotion()`.
  - Compute `const animatePhoto = !reduce && media.kind === 'image'` (independent of `fit`).
  - When `animatePhoto` is true, render the image as `motion.img` with:
    - `style={{ transformOrigin: variant.origin }}`
    - `animate={{ scale: [1, 1.12], x: [variant.fromX, variant.toX], y: [variant.fromY, variant.toY] }}`
    - `transition={{ duration: 25, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}`
    - keep existing `onLoad` (fit detection), `onError`, `className={mediaFit}`, `draggable={false}`.
  - When `animatePhoto` is false (reduced motion), render the plain `<img>` exactly as today.
  - Fit detection (`contain` ↔ `cover`) is unchanged; the `mediaFit` class still applies, and the Ken Burns transform layers on top of whichever fit resolves.
- The image already sits inside an `overflow-hidden` container, so the zoom is clipped cleanly with no layout shift.
- No changes to `MemoryStage`, the composer, hooks, data, or styling tokens.

## Verification

- Open a memory with a **mix** of portrait and landscape photos: confirm every photo animates with a slow, smooth zoom/pan that loops and reverses without snapping, and the feel is consistent across aspect ratios.
- Confirm no blank edges appear on letterboxed photos during the zoom.
- Step across photos: confirm directions differ between photos and are stable on revisit; chrome stays fixed and readable.
- Confirm videos behave as before.
- Toggle OS "reduce motion" and confirm the animation is disabled.

# Fix first-slide transition glitch in the scrapbook viewer

## Problem

When opening a scrapbook entry with multiple media, the **first** transition (media 1 → media 2) looks like a crossfade/jumble instead of a clean horizontal slide. Every later transition (2 → 3, etc.) slides correctly.

## Root cause

In `src/components/custom/MemoryStage.tsx`, the slide's `initial`, `animate`, and `exit` are written as **inline object literals** that read the `direction` prop at render time:

```text
exit={slide ? { x: direction > 0 ? '-100%' : '100%', opacity: 0.4 } : { opacity: 0 }}
```

Framer-motion captures the exiting element's `exit` values from that element's **last render**, not from the current navigation. The very first slide was last rendered while `direction === 0`. So when navigating 1 → 2, slide 1 evaluates its exit with the stale `direction = 0` and leaves toward `+100%` (the right) — the same edge slide 2 enters from. The two overlapping on the right edge produce the crossfade-looking motion.

On 2 → 3, slide 2 was last rendered with `direction = 1`, so its exit correctly resolves leftward and the slide is clean.

## Fix

Convert the inline literals into framer-motion **variants** and pass `custom={direction}` to both `AnimatePresence` and the `motion.div`. Variant *functions* are re-resolved using `AnimatePresence`'s `custom` value at the moment of exit, so the exiting slide always uses the current navigation direction — eliminating the stale-direction glitch. This is framer-motion's standard slider pattern.

### Changes in `src/components/custom/MemoryStage.tsx`

- Define a variants object that supports both animation modes (`slide` and `fade`), e.g.:

```text
enter:  (dir) => slide ? { x: dir === 0 ? 0 : dir > 0 ? '100%' : '-100%', opacity: 0.4 } : { opacity: 0 }
center: { x: 0, opacity: 1 }
exit:   (dir) => slide ? { x: dir > 0 ? '-100%' : '100%', opacity: 0.4 } : { opacity: 0 }
```

- On the `motion.div`, replace the inline `initial`/`animate`/`exit` objects with `variants={...}` plus `initial="enter"`, `animate="center"`, `exit="exit"`, and keep `custom={direction}`.
- Keep `AnimatePresence` with `initial={false}`, `mode="popLayout"`, and `custom={direction}` (already present).
- Leave the `transition` logic, drag/swipe handlers, and chevrons unchanged.

No other files change. This is a presentation-only fix.

## Verification

- Open a multi-media entry and step 1 → 2: it should push horizontally with no crossfade.
- Confirm 2 → 3, back-navigation (2 → 1), and swipe gestures still slide correctly in the right direction.
- Confirm the editor's `fade` animation path (if used) still cross-fades.

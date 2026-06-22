## Problem
On desktop, the empty-state "Add photos or video" button inside `MemoryComposer` is still disproportionately large within the centered card. It currently uses `aspect-[4/3] w-full md:max-w-md`, which makes it ~336 px tall even on a modest monitor — a huge blank drop-zone that dominates the composer.

## Fix
In `src/components/custom/MemoryComposer.tsx`, tighten the empty-state button styles on `md:` and up only, leaving mobile untouched:

- Replace `aspect-[4/3]` with `aspect-[4/3] md:aspect-video` (shorter on desktop).
- Lower `md:max-w-md` to `md:max-w-xs` (320 px cap).
- Shrink icon circle: `md:h-10 md:w-10`.
- Shrink icon: `md:h-5 md:w-5`.
- Drop label size: `md:text-sm`.

These changes apply only inside the `!hasMedia` branch of the composer.

## Verification
- Preview the desktop composer in the empty state and confirm the button feels like a compact prompt rather than a billboard.
- Add a photo and confirm the media preview + filmstrip still look balanced within the same card.
- No mobile regressions expected because every change is behind `md:`.
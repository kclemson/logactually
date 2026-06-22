Make the desktop memory viewer inset from viewport edges instead of full-bleed.

## Problem
`MemoryScaffold` currently renders the memory viewer with `fixed inset-0 z-50 bg-black`, covering the entire desktop viewport. The user finds this too large and wants it inset with visible surrounding space.

## Changes

### `src/components/custom/MemoryScaffold.tsx`
- Wrap the fixed root in a desktop-only inset container: on viewports >= `md` ( Tailwind `md:` breakpoint), apply outer padding and rounded corners so the viewer floats like a lightbox.
- Add `md:p-6 lg:p-10` padding on the outer wrapper to create the inset.
- Change the inner surface from `fixed inset-0` to `fixed inset-0 md:inset-6 lg:inset-10` on the black background layer, or alternatively keep `fixed inset-0` on the backdrop and constrain the content surface with max dimensions. **Chosen approach:** Add a `md:rounded-xl` border radius to the inner black surface and inset it with `md:inset-4 lg:inset-8` (exact values TBD in implementation) so edges of the viewport remain visible behind a translucent or solid app background.
- Keep mobile unchanged: mobile remains full-bleed `inset-0` with safe-area handling.
- Ensure `z-50` and overlay children (calendar, composer) remain correctly positioned relative to the inset frame.

### Visual result
- Desktop: dark background of the app peeks through around all four edges; the memory viewer is a rounded rectangle centered on screen.
- Mobile: unchanged full-bleed experience.

## Verification
- Open the memory viewer on desktop preview and confirm visible inset margins and rounded corners.
- Confirm mobile preview still shows full-bleed with no rounded corners.
- Confirm navigation, overlays, and keyboard interactions still work within the inset frame.
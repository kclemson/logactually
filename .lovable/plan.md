Cap the memory composer and viewer to reasonable desktop dimensions so the media area doesn't dominate large monitors.

Problem
- The composer is `fixed inset-0` on all breakpoints, so on a wide desktop screen the empty "Add photos or video" button (`aspect-[4/3] w-full`) and the media preview (`h-[42vh]`) become overwhelming.
- The viewer (MemoryScaffold) already uses `md:p-6 lg:p-10`, but on a very large monitor the inner card still stretches edge-to-edge within that padding.

Changes

1. MemoryComposer — desktop card treatment (matches viewer)
   - Wrap the root `fixed inset-0` container so that on `md:` and up it shows a dark backdrop with a centered, rounded card instead of full-bleed.
   - Keep full-bleed on mobile (below `md`).

2. Empty "Add photos or video" button
   - Add `md:max-w-xl md:mx-auto` so the 4:3 drop zone stops growing past ~576 px wide on desktop.
   - Slightly reduce the icon circle size on desktop (`md:h-12 md:w-12`) to keep it proportional.

3. Media preview (when files are present)
   - Change `h-[42vh]` to `h-[42vh] md:max-h-[480px]` so the preview doesn't stretch excessively on tall monitors.
   - Center it with `md:mx-auto`.

4. MemoryScaffold viewer card (desktop max width)
   - Add `md:max-w-5xl md:mx-auto` to the inner card so the viewer doesn't keep widening on 4K+ displays.
   - This keeps the existing `md:p-6 lg:p-10` padding intact.

Verification
- Preview on desktop (≥768 px and ≥1024 px) to confirm the composer looks like a centered modal, not a full-screen wall.
- Preview the viewer to confirm the media card has a sane max width.
- Quick mobile smoke test to ensure no regressions.
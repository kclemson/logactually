# Scrapbook: composer overflow fix + integrated viewer overlay

Two parts: a targeted bug fix for the editor, and the carefully-considered visual redesign for the read-only viewer (editor styling left as-is for now, per "viewer first").

## Part 1 — Fix the composer overflow (mobile)

**Root cause:** On mobile the whole app is wrapped in `PullToRefresh`, whose inner content div *always* carries `transform: translateY(0px)`. Any non-`none` transform makes that div the containing block for `position: fixed` descendants, so the composer's `fixed inset-0 z-50` is measured against the page-content area instead of the screen. It gets clipped (bottom nav stays visible) and scrolls with the page, pushing the filmstrip, caption, and category chooser off-screen. A tall video preview just made it worse. Desktop has no `PullToRefresh`, which is why it only happens on mobile.

**Fixes (both small, low-risk):**
1. `PullToRefresh.tsx`: only apply a transform while actually pulling — use `transform: pullDistance ? translateY(...) : 'none'`. At rest there's no containing block, so any `fixed` descendant behaves correctly. This is general hygiene that also protects future fixed overlays.
2. `MemoryComposer.tsx`: render the immersive surface through a React portal to `document.body`, so the editor is structurally independent of whatever ancestor it's mounted under (belt-and-suspenders; guarantees true full-screen even if a transformed ancestor reappears).

After this, the editor is genuinely full-screen: stage shrinks (`flex-1`), and the dots/date/filmstrip/caption/category/actions block stays pinned and fully visible regardless of media size.

## Part 2 — Integrated text-over-media in the viewer

Goal: collapse the separate dark panel into an overlay anchored to the bottom of the media, with a gradient scrim for legibility — quiet and photo-first, not heavy social-app chrome.

**Chosen look:** the minimal soft-scrim direction with a glass close button. Date + teal category tag on one line, caption below, progress dots, then the action row (calendar / edit / delete) with a rounded glass close `X` aligned right. Keeps the project's teal category accent (not the blue shown in the mockups).

**Smart per-orientation fill (viewer only):**
- Portrait media (taller than wide) → fills the frame (`object-cover`), true TikTok feel; text sits on the image.
- Landscape/square media → stays letterboxed (`object-contain`); the scrim blends image bottom into the black bar so the overlay still reads cleanly.
- Orientation detected from the loaded media: `naturalWidth/Height` for images, `videoWidth/Height` (on `loadedmetadata`) for video. Until known, default to letterbox.

**Scrim:** bottom-anchored gradient (`from-black/90 via-black/30 to-transparent`) plus a subtle text shadow, so text is legible over any photo and over a black bar. The current full-block gradient is replaced by this overlay.

**Layout change (shared primitive):** add a placement option to `MemoryScaffold` — e.g. `bottomPlacement: 'stacked' | 'overlay'`. 
- `stacked` (default): current behavior; the composer keeps using this unchanged.
- `overlay`: stage fills the whole surface; the bottom block is absolutely positioned over it with the scrim. The viewer opts into `overlay`.

This keeps both surfaces on the same primitive (per the earlier architecture decision) while changing only the viewer's presentation.

**Motion:** gentle fade/slide-up of the caption block on slide change (Motion for React), matching the existing stage transition register.

## Technical notes
- Files: `src/components/PullToRefresh.tsx`, `src/components/custom/MemoryComposer.tsx`, `src/components/custom/MemoryScaffold.tsx`, `src/pages/MemoryViewer.tsx` (viewer overlay + per-orientation logic in `MediaSlide`/`SlideContent`).
- No backend, schema, or data changes.
- No changes to the editor's visual treatment (only the overflow fix). The editor's text-over-media pass can be a follow-up.
- Video controls: when a portrait video plays full-bleed, the overlay caption/actions sit above the native controls' scrim area; the action row stays tappable. Long captions keep the existing scroll cap.
- Verify on a 390px-wide viewport: composer controls fully visible after adding a video; viewer overlay legible for both a portrait and a landscape item.

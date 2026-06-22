# Scrapbook performance — the four real fixes

All four are frontend-only and surgical. Below is the exact architecture for each, with the technical assumptions I verified.

## 1. Stop blurring full-resolution images

**Problem:** Both surfaces paint a `blur-2xl` (`blur(40px)`) `scale-110` backdrop whose `background-image` is the **full-res** asset, and in the viewer it sits behind a Ken Burns image that animates `scale(1) → scale(1.45)` infinitely (`index.css:172-184`). A 40px Gaussian blur over a ~1920px bitmap recomposited every frame is the heaviest thing on screen, worst on mobile.

**Fix:**
- `MemoryViewer.tsx` `MediaSlide` (lines 424, 444-451): resolve a **separate small signed URL** for the backdrop via `getSignedMemoryUrl(memoryThumbPath(media), MEMORY_THUMB_TRANSFORM)` (the 240px transform already used by list thumbnails — already cached, so often free) and use that as the backdrop `background-image`. The sharp foreground `<img>`/`<video>` keeps the full/viewer-res URL.
- `MemoryComposer.tsx` `MediaPreview` (lines 566-571): the local object-URL can't be transformed, so just soften the cost — drop `blur-2xl` → `blur-xl` and keep it. (Composer previews are transient, so this is minor; the viewer is the real win.)

**Why it's safe:** a blurred backdrop is intentionally low-detail; a 240px source is visually identical once blurred.

## 2. Preload adjacent slides + serve a viewer-sized image

**Problem:** `MediaSlide` (`MemoryViewer.tsx:386-408`) only resolves its signed URL and downloads the asset once it becomes the current slide, so every swipe flashes "Loading…" then decodes a fresh image.

**Fix — preloading (the core change):**
- Add a pure helper `resolveNeighbor(days, dayIndex, itemIndex, dir)` that mirrors the existing `goNextItem`/`goPrevItem` day-crossing logic but returns the target `MemoryMedia` without touching state.
- In `MemoryViewer`, add one `useEffect` keyed on `[dayIndex, clampedItemIndex, days]` that, for offsets `-1, +1, +2`, warms each neighbor: call `getSignedMemoryUrl(...)` (populates the in-memory cache) and, for images, construct `new Image()` with that URL (or `img.decode()`) so the bitmap is decoded before arrival. Skip video byte-buffering — only warm its signed URL. This is fire-and-forget; no state, no render impact.
- Because `getSignedMemoryUrl` caches per `(path, transform)` key (`memory-media.ts:139-175`), the neighbor warm and the actual `MediaSlide` mount must request the **same** URL/transform so it's a cache hit. Centralize this in one helper (e.g. `viewerImageUrl(media)`) used by both the preloader and `MediaSlide`.

**Fix — viewer-sized transform (secondary):**
- Add a `MEMORY_VIEW_TRANSFORM = { width: 1600, height: 1600, resize: 'contain' }` and use it for the main image. Verified: Supabase `'contain'` bounds the image within the box **preserving aspect ratio with no padding** (longest side ≤ 1600), so the `onLoad` cover/contain fit logic (`applyFit`, using natural W/H ratio) still works unchanged. Originals are already capped at 1920 (`MAX_IMAGE_DIMENSION`), so this is a modest byte/decode saving — preloading is what removes the perceived stall. Value is tunable; 1600 keeps desktop full-bleed crisp.

## 3. Add staleTime so focus/return doesn't refetch the whole scrapbook

**Problem:** App uses a bare `new QueryClient()` (`App.tsx:23`), so default `staleTime: 0`. `useMemoryDays` (up to 2000 entries + all media metadata, `useMemoryDays.ts:39-49`) and `useMemoryCovers` refetch on every mount and window-focus, rebuilding the day map and re-signing every thumbnail.

**Fix (surgical, per-query — no app-wide behavior change):**
- `useMemoryDays.ts:29-30` and `useMemoryCovers.ts:19-20`: add `staleTime: 5 * 60_000` (and `gcTime` ~30 min). With a non-zero staleTime, React Query skips the on-focus refetch while data is fresh, which also eliminates the recurring thumbnail re-signing churn. Mutations already `invalidateQueries`, so edits/deletes still refresh immediately.

**Note on the `thumbUrl` cache mutation** (`useMemoryCovers.ts:43-44` writes onto rows shared with `useMemoryDays`): once #3 stops the constant refetch, this is no longer wiped repeatedly. I'll leave the logic as-is unless it proves to cause a stale-thumbnail bug — changing it is out of scope for perf and risks regressions.

## 4. Make the calendar O(1) per cell

**Problem:** `MemoryViewer.tsx:297` runs `days.some(d => d.date === format(date,'yyyy-MM-dd'))` for every rendered calendar cell, every render — thousands of linear scans over `days` each time the picker opens.

**Fix:** build `const dateKeySet = useMemo(() => new Set(days.map(d => d.date)), [days])` and use `dateKeySet.has(format(date,'yyyy-MM-dd'))` in both the `disabled` predicate (line 297) and ideally derive `datesWithData` alongside it. O(1) lookups, computed once per `days` change.

## Verification plan
- Drive the viewer via Playwright on the live preview: open the gallery, swipe several slides, and confirm no "Loading…" flash on neighbors (preload working) and that the backdrop requests the 240px URL, not the full asset (check network).
- Confirm returning to `/custom` and re-focusing the tab fires no new `custom_log_entries`/`memory_media` requests within the stale window (network panel).
- Open the calendar on a large library and confirm it opens without a jank spike.
- Screenshot the viewer + composer to confirm the blur backdrop looks unchanged.

## Out of scope (unchanged from before)
No backend/schema changes. Not touching the 2000-row payload (viewer needs the full ordered set to navigate), not batching signed-URL calls (Supabase's batch API doesn't support the image `transform` thumbnails rely on, and #3 removes the recurring cost), and skipping the cheap memoization micro-opts.
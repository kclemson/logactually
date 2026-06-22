# Make the scrapbook load fast

## What's actually slow (root cause)

Two compounding problems, both in how thumbnails are fetched — not in how much data there is (there are only ~20 media items today, so the lag is structural, not volume).

1. **A request waterfall, one network call per thumbnail.** Today each `MemoryThumb` independently calls `getSignedMemoryUrl(...)` in a `useEffect` after it mounts. So the sequence is: load entry text → load cover metadata → *then* every thumbnail fires its own `createSignedUrl` request. The text shows first; the thumbnails trickle in behind a pile of separate round-trips. That's the "gray squares for a while" symptom.

2. **Full-resolution images used as tiny thumbnails.** Images are stored at up to 1920px / ~85% JPEG. The list shows them at 48px (compact) or 80px (rich) squares, but the browser still downloads the entire full-size file for each square. So even once a URL is signed, there's a big download before the gray fills in.

## The fix (best practices)

Two changes that together eliminate the waterfall and shrink the bytes:

### 1. Batch-sign URLs once, in the data hook (not per-thumbnail)
- Add a `getSignedMemoryUrls(paths[])` helper in `src/lib/memory-media.ts` that uses Supabase's batch signing (`createSignedUrls`) — one request for every thumbnail on screen instead of N. It shares the same in-memory cache and TTL logic as the existing single-path helper, so already-cached paths are skipped.
- Have `useMemoryCovers` (used on the `/custom` page) and `useMemoryDays` (used by the viewer) mint all their thumbnail URLs in one batched call as part of the query, and return the signed URL alongside each media item.
- `MemoryThumb` becomes a presentational component that receives a ready `url` prop instead of fetching its own. It keeps its existing on-error re-mint fallback. This removes the per-thumbnail `useEffect` round-trip entirely.

Result: entry text + thumbnails resolve together off a single signing request, instead of a multi-stage waterfall.

### 2. Serve small thumbnail derivatives for list views
- Request resized thumbnails (e.g. ~200px, `resize: cover`) for the list/cover thumbnails via Supabase Storage's image transformation, so each gray square fills from a few KB instead of a few hundred KB. The immersive viewer keeps requesting the full-size image (unchanged) since it's shown full-bleed.
- We store `width`/`height` on each media row already — use them to reserve each thumbnail's box so nothing shifts as images arrive (less visual jank).
- **Fallback:** if storage image transformation isn't enabled on this backend, transformed URLs would error. In that case we fall back to (a) generating a small thumbnail derivative at upload time (stored next to the original, like video posters already are) for all *new* uploads, plus a one-time backfill for the ~16 existing images. I'll confirm which path applies during the build by verifying a transformed URL returns an image, and implement whichever works — without changing any user-facing behavior.

## Files touched
- `src/lib/memory-media.ts` — add batched + transform-aware signing helper; keep existing single helper and cache.
- `src/hooks/useMemoryCovers.ts` — batch-sign covers; return media + thumb URL.
- `src/hooks/useMemoryDays.ts` — batch-sign thumbnails for the viewer path.
- `src/components/custom/MemoryThumb.tsx` — accept a `url` prop (presentational); keep error re-mint.
- `src/components/CustomLogEntriesView.tsx` — pass signed URLs / dimensions through to `MemoryThumb`.
- (Conditional, only if transforms are unavailable) `src/lib/memory-media.ts` + `src/hooks/useMemoryMedia.ts` — generate a small thumbnail blob at upload, plus a one-off backfill for existing images.

## Out of scope
- No change to the immersive viewer's full-bleed image quality.
- No schema changes unless the transform-fallback path is needed (only adds a thumbnail storage path convention, mirroring existing posters).

## Verification
- Reload `/custom` (scrapbook) with Playwright at mobile width and confirm thumbnails appear effectively with the text, not seconds later.
- Inspect network: confirm a single batched signing request and small (KB-scale) thumbnail downloads rather than full-size images.
- Confirm the viewer still loads full-resolution media.

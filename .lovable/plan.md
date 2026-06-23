# Fix: show a video thumbnail immediately in the composer

## Problem
When a video is picked in the memory composer, the main preview and the filmstrip render a raw `<video>` element with no `poster`. On iOS Safari a `<video>` does not paint its first frame until the user interacts with it, so it looks blank/black until tapped. Images don't have this issue.

## Root cause
`MemoryComposer` previews newly-picked videos via `<video src={previewUrl}>` (filmstrip ~line 471 and `MediaPreview` ~line 614) with no poster frame. The project already has `extractVideoMeta(file)` in `src/lib/memory-media.ts`, which decodes a video off-screen and produces a first-frame poster `Blob` — but it's only used at upload time, not for the live preview.

## Fix — generate a local poster for just-picked videos (reuses existing machinery)

**`src/components/custom/MemoryComposer.tsx`**

1. **Extend the `PendingFile` `'new'` variant** with an optional `posterUrl?: string | null` (object URL of the generated first-frame image; `undefined` while pending, `null` if extraction failed).

2. **Kick off poster generation in `addFiles`** (event-driven, no effect). After appending the new files, for each newly-added item whose `kind === 'video'`, call `extractVideoMeta(file)`; when it resolves, if `posterBlob` exists, create an object URL and `setFiles` to attach `posterUrl` to the matching `id`. Guard against the item already having been removed (map by id, no-op if gone). Import `extractVideoMeta` from `@/lib/memory-media`.

3. **Use the poster in `MediaPreview`** (the large preview): for the video branch, add `poster={file.posterUrl ?? undefined}` and `preload="metadata"`. The poster paints the frame instantly; tapping still plays as before.

4. **Use the poster in the filmstrip thumbnail**: for a video item, render `<img src={file.posterUrl}>` (with the existing `Play` overlay) when `posterUrl` is set; while it's still being generated, keep the current `<video>`/loader fallback so there's no blank gap.

5. **Revoke poster object URLs** to avoid leaks: extend the existing unmount cleanup (the `filesRef` effect) and `removeCurrent` to also `URL.revokeObjectURL(posterUrl)` for `'new'` items that have one, alongside the existing `previewUrl` revocation.

### Technical notes
- Poster generation is best-effort: `extractVideoMeta` already resolves with `posterBlob: null` on failure, in which case we leave `posterUrl` null and the video simply behaves as today (no regression).
- This is preview-only; the upload path continues to generate/store its own poster independently — no change to storage, schema, or the viewer.
- No new effects; the async work is started from the `addFiles` event handler, consistent with project conventions.

## Verification
- On a phone, pick a `.mov`/`.mp4` in the composer → the large preview shows the first frame immediately (with a play affordance) without tapping; the filmstrip shows the same frame.
- Tapping the preview still plays the video.
- Removing the video and unmounting the composer leaves no leaked object URLs; no console errors.
- A corrupt/undecodable video still previews without crashing (falls back to current behavior).

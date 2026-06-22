## Goal

Fix the disappearing backdated video entry, make the saving state impossible to miss, and show beautiful real per-file upload progress.

## Root cause (issue #1)

The June 19 entry was never written to the database — confirmed by querying it directly. The composer uploads all media first and only inserts the entry if every upload succeeds. The video was larger than the platform's ~50 MB single-request cap (your largest *successful* video is 34.7 MB), so after a long upload it failed, the entry was rolled back, and only tiny red error text appeared, which was easy to miss. A few orphaned files were also left in storage.

The fix for large videos and the fix for "show real progress" are the same change: resumable uploads.

## Plan

### 1. Resumable uploads (reliability + real progress)
- Add the `tus-js-client` dependency.
- Add an `uploadMemoryFileResumable(path, file, contentType, onProgress)` helper in `src/lib/memory-media.ts` that uploads via the resumable storage endpoint using the current user's access token, reporting `bytesUploaded / bytesTotal` through `onProgress`. Removes the ~50 MB cap so long phone videos upload reliably.
- Route all media + poster uploads in `useCreateMemory` and `useUpdateMemory` through this helper instead of `storage.upload()`. Small images upload near-instantly and simply jump to 100%.

### 2. Progress plumbing
- Extend the progress callback to carry a numeric fraction alongside status: `onFileProgress(index, status, progress)` (and the edit path's `onItemProgress`).
- In `MemoryComposer`, store `progress: number` on each `PendingFile` and update it as uploads report.

### 3. Radial progress ring (issue #3)
- New reusable `RadialProgress` SVG component (animated stroke sweep, teal accent matching the composer).
- **Single media:** the ring overlays the large main preview, centered, so it's unmissable.
- **Multiple media:** each filmstrip thumbnail gets its own small ring overlay showing that file's progress (replacing the current generic spinner), and the currently-viewed item also shows the ring on the main preview.
- Rings animate smoothly toward each reported value so they feel elegant rather than jumpy.

### 4. Centered "Saving…" overlay (issue #2)
- While saving, dim the whole composer and show a centered card with a spinner and "Saving your memory…", blocking interaction until done. This replaces relying on the small "Saving…" button label.
- When media is still uploading, the card also shows overall progress (e.g. "Uploading 2 of 3…") so it's clear the app is busy, not frozen.

### 5. Clearer errors
- Surface save/upload failures prominently in the centered overlay (a clear message + Retry/Dismiss) instead of small red text, so a failed save can't be mistaken for success.

## Verification
- Build passes; run existing `useMemoryMedia` / memory tests.
- Drive the composer with Playwright on a desktop viewport: add media, confirm the radial ring renders and advances, confirm the centered Saving overlay appears, and confirm an entry (including a backdated one) shows in the list afterward.

## Technical notes
- Resumable endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`, 6 MB chunks, `Authorization: Bearer <access_token>` from `supabase.auth.getSession()`, metadata `bucketName`, `objectName`, `contentType`, with `upsert: false` semantics preserved.
- Keep the existing atomic flow (upload-all-then-insert, cleanup-on-failure) intact; only the per-file upload mechanism and progress reporting change.
- No database or schema changes required.

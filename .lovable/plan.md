## Goal

Let the user pick multiple PDFs/images in one go from the bloodwork upload card, and process them as a batch instead of one-at-a-time.

## Current behavior (single-file)

`BloodworkUploadInput` → file input (single) → `uploadAndParse` mutation per file:
1. SHA-256 hash → check for existing panel → throw `DuplicateFileError` if found
2. Upload to `bloodwork-files` storage
3. Insert `bloodwork_panels` row (`parse_status: 'pending'`)
4. Invoke `parse-bloodwork` edge function, await result
5. UI shows a single "saved" summary card with date / sections / result count, plus a duplicate-blocked dialog for one file.

## Changes

### 1. File input
- Add `multiple` to the `<input type="file">`.
- Update CTA copy to "Choose PDFs or images" and accept N files.
- Keep the same 20MB-per-file limit; validate client-side and surface per-file errors.

### 2. Batch upload orchestration (in `BloodworkUploadInput`)
Replace the single `busy / saved / error / duplicate / pendingFile` state with a per-file queue:

```ts
type FileJob = {
  id: string;            // local uuid
  file: File;
  status: 'queued' | 'uploading' | 'parsing' | 'done' | 'error' | 'duplicate';
  result?: SavedState;   // when done
  error?: string;
  duplicate?: BloodworkPanel;
};
```

- On file selection, build a `FileJob[]` and run them through `uploadAndParse.mutateAsync` with **limited concurrency** (e.g. 3 at a time) so we don't overload the parse-bloodwork edge function or the user's network. A small `pLimit`-style helper is enough; no new dependency required.
- Each job updates its own status independently; the card re-renders as jobs progress.

### 3. Hook (`useBloodworkPanels.uploadAndParse`)
No signature change needed — it already takes a single `{ file, logTypeId }`. We just call it N times in parallel from the component. The existing `onSuccess` invalidation already refreshes the panel list per call; that's fine.

Optional small tweak: skip the `onSuccess` query invalidation per-call and invalidate once at the end of the batch to reduce refetch churn. Low priority.

### 4. UI for batch progress
Replace the single saved card with a compact per-file list:

```
[ ✓ ] labcorp-2024-01.pdf      Jan 12, 2024 · 24 results
[ ⟳ ] quest-2024-03.pdf        parsing…
[ ! ] mystery.pdf              duplicate — [View existing] [Upload anyway]
[ ✗ ] scan.jpg                 Upload failed: ...
```

- Reuse the existing icons (`CheckCircle2`, `Loader2`, `AlertCircle`).
- For successful items whose extracted date ≠ `loggedDate`, show the date inline and keep a single "View" button at the bottom (navigates to whichever date the user picks — likely scoped per-row "View" link on date-mismatched items, since each file can have its own date).
- Show a single primary action at the bottom: **Done** (calls `onSuccess?.()`) — enabled once no jobs are still `uploading`/`parsing`.

### 5. Duplicates
Today's single duplicate dialog (`DuplicateBlockedDialog`) is modal and blocks the whole flow. For batch:
- Don't pop a modal mid-batch. Instead, mark the job as `status: 'duplicate'` inline and show `[View existing]` / `[Upload anyway]` actions on that row.
- `Upload anyway` retries that one job with the same random-byte tagging trick already in `handleUploadAnyway`.
- Other files in the batch keep going independently.

### 6. Errors
Per-row error message; the rest of the batch is unaffected. No global error banner.

### 7. Cancel
`onCancel` should only be enabled if no jobs are currently `uploading`/`parsing` (or it should request confirmation). Simplest: disable while any job is in-flight.

## Out of scope

- No edge-function changes: each file is still parsed by its own `parse-bloodwork` invocation. If batching at the function level becomes useful later, that's a separate task.
- No drag-and-drop (can be a follow-up; the multi-select picker covers the request).
- No changes to the panel list / `BloodworkPanelGroup` rendering.

## Files to touch

- `src/components/BloodworkUploadInput.tsx` — most of the work (state model, batch runner, list UI).
- Possibly `src/hooks/useBloodworkPanels.ts` — only if we decide to debounce the cache invalidation; otherwise unchanged.

## Risk

- Concurrency on `parse-bloodwork`: cap at 3 in parallel to stay polite.
- Storage bucket upload contention: negligible at 3 concurrent.
- Existing duplicate logic and "upload anyway" path are preserved, just surfaced per-row instead of modally.

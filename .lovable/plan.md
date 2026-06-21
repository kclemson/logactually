# Visual Memory Diary

A custom-log type for logging photos/videos and/or a text note per day, organized by optional category, browsable in a dedicated immersive full-screen viewer. Built to extend the app's "log anything" vision without disturbing Food/Exercise/Custom code, and with a data + security model designed for future sharing and multi-author contributions.

## Core model decisions

- **One memory log type** (`value_type = 'memory'`). Not multiple types.
- **Category is an optional property** of each memory (freeform text, autocomplete from the user's existing categories, e.g. "Garden", "Vacation 2026"). Can be left blank.
- **Media is optional.** A memory can be text-only, media-only, or both. Save requires *something*: a note OR at least one media item.
- **An entry = one author's submission**: `text_value` (optional note) + `logged_date` + optional `category`, with its ordered `memory_media` rows. This is the text↔media link.
- **A "memory" in the viewer = all entries sharing a `logged_date`** (today all authored by the owner; later possibly multiple authors).
- **No caps**: unlimited media per entry and per day, no length/size/count limits.
- **"public" = Postgres schema name only.** `public.memory_media` lives in the default app schema like every other table; it has no bearing on visibility. Access is governed by RLS + a private storage bucket. Default is strictly private to the owner.

## Data model

Add to `custom_log_entries` (additive, nullable — memory-only, harmless to other log types):
- `category text` — optional category for memory entries.
- `created_by uuid` — the author of the row. Today equals `user_id`; reserved so future invited contributors are distinguishable from the diary owner. Backfill existing/other rows to `user_id`.

New table `public.memory_media` (one row per file):

```text
id            uuid pk
user_id       uuid  -> auth.users   (diary OWNER; RLS scope)
created_by    uuid  -> auth.users   (uploader/author; = user_id today)
entry_id      uuid  -> custom_log_entries(id) on delete cascade
storage_path  text   (memory-media/{user_id}/{entry_id}/{file})
kind          text   ('image' | 'video')
mime_type     text
width         int
height        int
duration_secs numeric  (videos only)
poster_path   text     (video first-frame thumbnail)
sort_order    int
created_at    timestamptz
```

- Full GRANT block + RLS scoped to `auth.uid() = user_id`. Read-only/demo users blocked via existing `is_read_only_user(uuid)` pattern on write policies.
- Day in `logged_date`; entry order within a day by `created_at`; media order by `sort_order`.

## Storage

- New **private** bucket `memory-media`, RLS on `storage.objects`: a user accesses only files under their own `{user_id}/...` prefix. Owner-prefixed paths are stable so a future share-aware policy can grant contributor access without moving files.
- Store only the path in the DB (never base64), per project convention.
- **Signed URLs designed so nothing ages out mid-session:** long TTL (12-24h), minted when the viewer opens (not at app load), and silent re-mint + retry if any media fails to load.

## Capture flow — media-first atomic create

`MemoryEntryInput.tsx`:
1. Generate the entry UUID client-side up front.
2. User optionally adds a note, optionally picks a category (autocomplete), optionally selects/captures any number of media (`accept=image/*,video/*`, `capture` supported); thumbnails with remove/reorder. Save enabled once a note OR ≥1 media exists.
3. On save: upload **all** media (+ video poster frames) to `memory-media/{user_id}/{entryId}/...` first, with per-file progress.
4. Only after every upload succeeds: insert the `custom_log_entries` row + all `memory_media` rows.
5. Any upload fails → abort, nothing persisted. Final DB insert fails → best-effort cleanup of just-uploaded files. No "ghost" memories.

## Immersive viewer

Dedicated route `/custom/memories`:
- Full-bleed media over a blurred backdrop; clean text-only and single-media states.
- **Gesture map (explicit, no collisions):** horizontal swipe = change day; vertical swipe / tap zones = move between entries+media within the day; videos tap-to-play (no scrub in v1).
- Day header shows date, note, category; in-viewer calendar picker to jump to a day; optional category filter.
- `framer-motion` transitions; lazy signed-URL fetch with prefetch of adjacent days.

## Information architecture

- Lives under the **Custom** tab (like medication/bloodwork). No new top-level nav.
- Custom page memory card: **"View Memories"** (launches viewer) + **"Log"** (opens composer).
- "Log New" dropdown gains a `memory` branch → composer (mirrors `panel`→bloodwork, `medication`→med input).
- "By Date" view: compact rows (note + category + thumbnail strip, or note-only) tapping into the viewer at that day.
- Gated behind `showCustomLogs`. Demo users can interact but not save.

## Future-sharing & multi-author readiness (design only — no sharing UI now)

- **Owner vs author split** (`user_id` = owner, `created_by` = author) on entries and media.
- **Contributions are new entries, not edits.** When UserA later invites UserB/UserC to a day: UserB's photos and UserC's video+text each become their own entry (`user_id = UserA`, `created_by = contributor`) grouped under the same `logged_date`. Text is always attributed via the entry's `created_by`; media always hangs off an entry. Viewer can show per-author attribution.
- **Owner-prefixed storage paths** let a future share-aware storage policy grant contributor writes into the owner's prefix without moving files.
- A future `memory_shares` table (`owner_id`, date range or entry set, `grantee`/`share_token`, `permission` view|contribute, `expires_at`) layers in additively. Today's RLS (`user_id = auth.uid()`) is written so a share lookup can be OR-ed in (read for view; insert-where-`created_by = auth.uid()` for contribute) without rewriting policies or data.

## Build order

1. Backend: alter `custom_log_entries` (+`category`,`created_by`); create `memory_media` table; create `memory-media` private bucket + storage RLS.
2. Helpers + composer (capture, compression, poster, atomic upload) + minimal "By Date" display.
3. Immersive viewer.
4. Polish: in-viewer calendar + category filter, prefetch, refinements.

## Files

**New**
- `src/components/custom/MemoryEntryInput.tsx`
- `src/pages/MemoryViewer.tsx` (+ small subcomponents)
- `src/hooks/useMemoryMedia.ts` (upload/insert/cache via React Query)
- `src/hooks/useMemoryDays.ts` (day-grouped fetch)
- `src/lib/memory-media.ts` (+ `.test.ts`) — compression, poster extraction, aspect/duration helpers, path builders, signed-URL cache

**Edited (minimal, additive)**
- `src/hooks/useCustomLogTypes.ts` — add `'memory'` to `ValueType`
- `src/lib/log-templates.ts` — add "Memories" template
- `src/pages/OtherLog.tsx` — memory dialog branch + viewer entry
- `src/components/CustomLogByTypeView.tsx` — memory card/row variant
- App router — register `/custom/memories`

## Technical details

- Client-generated `entryId` (`crypto.randomUUID`) used as the storage sub-path so uploads precede the DB row.
- React Query caches invalidated after successful atomic create; no optimistic UI (only persisted memories appear).
- Signed URLs cached in-memory with TTL; re-mint on load error while viewer open.
- No `useEffect` for state sync (project guideline): composer resets via conditional mount/unmount; persistence in event handlers.
- Custom = teal theming; existing mobile dialog standards.

## Out of scope (deferred)

- Pinned one-tap "Log New <foo>" buttons.
- Any sharing UI / contributor invites (schema is ready; UI is not built).
- Video scrubbing/trimming and server-side transcoding.
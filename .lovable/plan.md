# Import posts into the Scrapbook (bulk)

Add a reusable, **format-agnostic** bulk importer for memories. You drop in exported `.html` files, review them all in **one combined list**, and click **Import once** to bring them all in. **Each post becomes one Scrapbook memory entry**: the post's date, its text combined into the note, every photo as the entry's slideshow. Any **hashtags found in the content become the entry's category** (no format is special-cased). Imported entries land in your existing Scrapbook memory type.

Nothing is labeled by a specific source/platform anywhere — not in the UI, not in the code. The importer is built so additional file formats can be supported later behind the same exact import experience, with only the internal detection/parsing differing.

## Where it lives (UX entry point)
In **Settings → Import and Export**, a new row: an **Import memories** button (shown only when custom logs / the Scrapbook type are available and the account isn't read-only), sitting alongside the existing export rows and Apple Health import. Clicking it opens the bulk import dialog. Generic label like "Import memories from files" — no source/platform name.

## Why an edge function is required
Photos in these exports are hosted on a remote CDN. A browser can't read those image bytes directly (cross-origin blocked), so it can't re-upload them. A small server-side function downloads each image and stores it in your private `memory-media` bucket — exactly where normal scrapbook photos live.

## How it works
```text
You pick many .html files at once
        |
   Browser detects format + parses each file:
     - date   -> entry date
     - text   -> note (cleaned of structural lines)
     - photos -> image URLs, in order
     - hashtags found in the text -> category
        |
   ONE review list — a row per post:
     | Post (text preview) | Date | Words | Photos | Status |
     Status = "New" or "Already imported"
     Each row has an include/skip checkbox; already-imported
     and undated rows are unchecked by default.
        |
   Click Import once  ->  imports every checked post:
       for each: download photos -> upload to memory-media
       -> create entry + media rows in your account
       (rows update live: importing -> done / failed)
        |
   Scrapbook refreshes; summary: X imported, Y skipped, Z failed
```

## The review list (single screen, bulk)
One table, one row per post:
- **Post** — short text preview (first line of the body).
- **Date** — parsed post date.
- **Words** — word count of the note text.
- **Photos** — number of images found.
- **Status** — `New`, or `Already imported` (duplicate guard, below). Posts with no detectable date show `Needs date` and are skipped.
- **Include checkbox** per row (already-imported / undated rows start unchecked), plus a header select-all / none toggle.

A single **Import** button imports all checked rows. During import each row shows live progress (importing → done / failed); a final summary reports counts.

## What gets imported per post
- **Date** → entry `logged_date`. Each post keeps its own date; the day-grouped scrapbook view clusters them.
- **Text** → the body becomes the entry note, with purely structural lines (a leading header line, a trailing hashtag-only line) stripped so the note reads cleanly.
- **Photos** → every image in the post, in document order, as the entry's ordered media (viewer shows a swipeable slideshow with the text as caption).
- **Category** → **hashtags found in the content** are used as the entry category (preserving the exact tag text, e.g. `#SomeTag`). If multiple hashtags appear, the first is used as the category. If none, the entry has no category. This is fully generic — there is no per-tag or per-source logic.

## Safety
- **Duplicate guard:** if a Scrapbook entry already exists with the same date and the same category, the row is marked "Already imported" and unchecked by default, so re-running won't create copies.
- **Per-post atomic:** each post imports independently; if its photos fail to download, that post is marked failed and its uploaded files are cleaned up — no half-imported entries. Other posts still import.
- Read-only/demo accounts can't import (same rule as normal scrapbook entries).

## Scope notes
- Input is one or more `.html` files. A full multi-file/`.zip` export is **not** unpacked in this pass — a possible follow-up.
- Photos are stored at a sensible web size to keep storage reasonable, consistent with how the app resizes normal uploads.

---

## Technical details

All names are generic (`memory-import`, no source/platform in identifiers). Format-specific parsing is isolated so new formats can be added later behind the same UI and hook.

**New edge function `supabase/functions/import-memory-entries/index.ts`**
- CORS headers on all responses; validates the caller's JWT in code and derives `user_id`.
- Input (validated with Zod): `{ logTypeId, loggedDate (YYYY-MM-DD), note, category (nullable), images: [{ url, width?, height? }] }` — one call per post.
- For each image: fetch bytes server-side, upload to `memory-media` at `userId/entryId/mediaId.jpg` (reusing `buildMediaPath` conventions from `src/lib/memory-media.ts`).
- Inserts one `custom_log_entries` row (`text_value`, `category`, `logged_date`) and ordered `memory_media` rows, using a Supabase client built with the caller's `Authorization` header so existing RLS (owner-only + `is_read_only_user`) is enforced.
- On failure for that post, removes uploaded files and returns a clear error.

**New `src/lib/memory-import/` (pure, unit-testable)**
- `types.ts` — `ParsedPost { sourceName, date | null, note, wordCount, category | null, images: [{ url, width?, height? }] }`.
- `index.ts` — `parseMemoryFile(htmlString, fileName): ParsedPost` that runs format **detection** (which structural shape the file matches) then dispatches to the matching parser. Designed so additional detectors/parsers register here without touching the UI.
- First parser handles the current export shape via `DOMParser`: date from the date line; note = paragraphs minus a leading header line and a trailing hashtag-only line, joined with `\n\n`; images from `<img>` in order (prefer a large `srcset` variant, fall back to `src`); category = first hashtag found anywhere in the text (kept verbatim).
- `hashtags.ts` — generic `extractHashtags(text): string[]` helper.

**New `src/hooks/useImportMemories.ts`** — given the checked posts, imports them **sequentially** via `supabase.functions.invoke('import-memory-entries', ...)`, exposes per-post status + overall progress, and invalidates memory/day caches (`useMemoryDays`, `useMemoryCovers`) at the end.

**New `src/components/custom/MemoryImportDialog.tsx`** — file input (`accept=".html"`, `multiple`); parses all files via `parseMemoryFile` into the single review table (built on `src/components/ui/table.tsx`) with include checkboxes, select-all, status badges; one Import button with live per-row status and a final summary. Follows the project's mobile dialog standards (`max-h-[Xdvh]`, top-anchored `top-[5%]`). Conditionally rendered so it unmounts on close (no effect-based reset).

**Edit `src/components/settings/ImportExportSection.tsx`** — add an "Import memories" row + dialog state, wired to the Scrapbook `logTypeId` (resolved from custom log types) and existing entry dates/categories for duplicate detection. Gated on custom logs enabled + Scrapbook type present + not read-only, matching the existing row gating.

No schema or migration changes — reuses `custom_log_entries`, `memory_media`, and the `memory-media` bucket as-is.
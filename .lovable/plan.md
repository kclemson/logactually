## Goal

Honor the "you can always export all your data" promise for the scrapbook feature. Add a single **Export Scrapbook** action in Settings → Import and Export that downloads one `.zip` containing every scrapbook (memory-type custom log): a self-rendering `index.html`, a machine-readable `metadata.json` manifest, and a `media/` folder with the actual photos and videos — using friendly, human-readable filenames (original filenames where available).

## Filename handling (the key decision)

Today the app does **not** retain original filenames — uploads get a GUID storage path (`{userId}/{entryId}/{mediaId}.{ext}`) and the original name is discarded. To produce nice export names:

- **New column** `memory_media.original_filename text` (nullable), populated on upload going forward with the user's `file.name`.
- **Export naming rule** for each media file:
  1. Use `original_filename` when present (sanitized: strip path separators/control chars, keep the real extension).
  2. Otherwise fall back to a clean generated name: `<scrapbook-slug>-<YYYY-MM-DD>-<NN>.<ext>` (NN = 1-based position within the day), never a raw GUID.
  - Collisions inside the same folder get ` (2)`, ` (3)` suffixes (same approach as the existing bloodwork-files export).
- Video posters are named `<base>-poster.jpg` alongside their video.
- The internal `storage_path` is unchanged (still GUID-based) — only export-facing names and the new metadata column change.

## Database change

A single migration:
- `ALTER TABLE public.memory_media ADD COLUMN original_filename text;` (nullable, no backfill possible for existing rows). No new RLS/grants needed — column on an existing, already-secured table.

## Capturing the filename on upload

In `src/hooks/useMemoryMedia.ts` (`useCreateMemory` and `useUpdateMemory`): pass `file.name` through the upload pipeline and include `original_filename: file.name` in the `memory_media` insert rows. Existing-media edits keep their stored value. Also add `original_filename` to the `MemoryMedia` interface.

## Data model recap (what we're exporting)

A scrapbook is a `custom_log_types` row with `value_type = 'memory'`. Content spans:
- `custom_log_entries` — one post per row: `id`, `logged_date`, `text_value` (note), `category` (hashtag), `created_at`.
- `memory_media` — attachments: `id`, `entry_id` (→ post), `kind`, `mime_type`, `width`, `height`, `duration_secs`, `poster_path`, `sort_order`, `original_filename` (new), `storage_path`.

The text↔media relationship is `entry_id` ordered by `sort_order`, preserved in the export both structurally (media nested in each post) and via stable ids + explicit relative file paths.

## Package structure

```text
scrapbook-export-2026-06-22.zip
├── index.html                  # double-click to view the whole archive rendered
├── metadata.json               # clean, versioned, machine-readable manifest
├── README.txt                  # plain-English explanation of contents/schema
└── media/
    └── <scrapbook-slug>/
        └── <YYYY-MM-DD>/
            ├── rome-sunset.jpg          # original name when known...
            ├── Travel-2026-06-01-02.mp4 # ...friendly fallback otherwise
            └── Travel-2026-06-01-02-poster.jpg
```

## `metadata.json` schema

```json
{
  "schema": "logactually.scrapbook.export",
  "version": 1,
  "app": "Log Actually",
  "exported_at": "2026-06-22T12:00:00.000Z",
  "scrapbooks": [
    {
      "log_type_id": "uuid",
      "name": "Travel",
      "slug": "travel",
      "entry_count": 12,
      "media_count": 34,
      "entries": [
        {
          "id": "uuid",
          "date": "2026-06-01",
          "created_at": "2026-06-01T18:22:00.000Z",
          "category": "#italy",
          "note": "Arrived in Rome...",
          "media": [
            {
              "id": "uuid",
              "entry_id": "uuid",
              "kind": "image",
              "mime_type": "image/jpeg",
              "original_filename": "rome-sunset.jpg",
              "file": "media/travel/2026-06-01/rome-sunset.jpg",
              "poster": null,
              "width": 1920,
              "height": 1280,
              "duration_secs": null,
              "sort_order": 0
            }
          ]
        }
      ]
    }
  ]
}
```

Machine-readability: ISO-8601 timestamps/dates, explicit `entry_id` on every media object (works for flat parsers), relative `file`/`poster` paths resolving against the zip root, `original_filename` preserved as metadata even though the on-disk name may differ after sanitizing/dedupe.

## `index.html` (renders offline, also machine-readable)

Single static HTML, no external deps, no `fetch` (works from `file://`):
- Inlines the manifest as `<script type="application/json" id="scrapbook-data">…</script>`.
- Adds a JSON-LD `<script type="application/ld+json">` (`ImageGallery`/collection) block.
- Renders per scrapbook: heading → posts grouped by date → date, category chip, note text, media grid. Images `<img src="media/…">`; videos `<video controls poster="…">`. Relative paths so double-clicking shows the fully rendered archive incl. video.
- Each post/media element carries `data-entry-id` / `data-media-id` attributes.
- Minimal self-contained inline CSS matching the scrapbook look (teal chips).

## Implementation

1. **Migration** — add `original_filename` to `memory_media` (above).
2. **`src/hooks/useMemoryMedia.ts`** — capture and insert `original_filename`; extend `MemoryMedia` type.
3. **`src/lib/scrapbook-export.ts`** (new, pure/testable):
   - `buildScrapbookManifest(scrapbooks)` → manifest + media fetch plan (storage_path → in-zip path + chosen filename).
   - `resolveExportFilename(media, ctx)` → original-name-or-friendly-fallback with sanitize + dedupe.
   - `renderScrapbookHtml(manifest)` → `index.html` string (escapes user text; embeds JSON + JSON-LD).
   - `slugify(name)`, `buildReadme()`.
4. **`src/hooks/useExportData.ts`** — add `handleExportScrapbook`: find `value_type='memory'` types, page through their `custom_log_entries`, chunk-load `memory_media`, build manifest, download each media + poster via short-lived signed URLs (concurrency = 3, worker-queue like bloodwork-files), add `index.html`/`metadata.json`/`README.txt`, generate and download `scrapbook-export-<date>.zip`. Reuse `isExporting`. Best-effort skip + log on any single media failure so one bad file can't abort the backup; note skips in README.
5. **`src/components/settings/ImportExportSection.tsx`** — add **Export Scrapbook** button when `memoryLogTypes.length > 0`, gated for read-only/demo like other exports. Copy: "Export photos, videos & notes (zip)".
6. **`src/lib/scrapbook-export.test.ts`** (new) — tests for manifest shape, path mapping, filename resolution (original vs fallback, sanitize, collisions), and HTML escaping.

## Behavior & edge cases

- Multiple scrapbooks → separate folders + sections in one zip with one master `index.html`.
- Text-only posts render as note cards; appear in JSON with `media: []`.
- Videos export as stored file + poster; HTML uses native `<video controls>`.
- Legacy media (no `original_filename`) → friendly fallback names, never GUIDs.
- Large archives build in memory via JSZip (same as bloodwork-files export); concurrency-limited fetching.
- Read-only/demo users: export disabled, matching existing gating.

## Verification

- After the migration, upload new scrapbook media and confirm `original_filename` is stored; confirm legacy rows export with friendly fallback names.
- Build a mixed scrapbook (image post, video post, multi-photo post, text-only post), run Export Scrapbook, unzip, and confirm: `index.html` renders all imagery and plays video offline; filenames are original/friendly (no GUIDs); `metadata.json` validates with correct relative paths and entry↔media references; counts match the app.
- Run the new unit tests; confirm the button is hidden for the demo/read-only user.
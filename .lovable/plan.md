# Unify scrapbook thumbnail loading: one signing path, bounded to what's on screen

## Problem

Scrapbook list items render through one shared component (`MemoryEntryRow`), but they're fed by two different data hooks:

- **Daily** uses `useMemoryCovers(entryIds)` — fetches the first 4 media and signs small thumbnails **only for the entries passed in**. Lean and bounded.
- **All** and **Scrapbook (focused)** use `useMemoryDays(typeId)` — loads every entry + all media, and signs the first-4 cover thumbnails for **every** entry (up to 2000) before the list can paint, even though only 30 days are rendered.

`useMemoryDays` exists mainly for the immersive viewer (`MemoryViewer`), which needs each entry's full media to build slides — but the viewer signs full-resolution URLs itself and never reads the `thumbUrl` the hook mints. So that signing pass is wasted for the viewer and far too broad for the list. That is what makes All/Scrapbook lag with gray squares while Daily feels fine.

## Fix: make `useMemoryCovers` the single thumbnail-signing path

### 1. `src/hooks/useMemoryDays.ts`
Remove the up-front cover-signing pass (the block that collects `coverPaths`, calls `getSignedMemoryUrls`, and assigns `m.thumbUrl`). The hook keeps loading entries + full media metadata (still needed by the viewer and by delete), but no longer signs anything. Media items come back with `thumbUrl` unset.

### 2. `src/components/CustomLogByTypeView.tsx` (`MemoryTypeBody`)
After computing `recent = days.slice(0, MAX_DATES)`:
- Collect the entry ids of the visible days only.
- Call `useMemoryCovers(visibleEntryIds)` to fetch + sign thumbnails for just those rows — exactly how Daily works.
- Pass the signed covers to each `MemoryEntryRow` for the thumbnail strip, while still passing the entry's full media count so the "+N" overflow badge stays accurate.

### 3. `src/components/CustomLogEntriesView.tsx` (`MemoryEntryRow`)
Add an optional `totalCount` prop (defaults to `media.length`). Since `useMemoryCovers` caps its result at 4, the focused/All views pass `totalCount={entry.media.length}` so "+N" reflects the true number of attachments. Daily's call site is unchanged. The thumbnail strip renders from the (capped, signed) `media` prop; the overflow count uses `totalCount`.

## Result
- Thumbnails are signed and downloaded **only for the rows actually on screen**, in all three views.
- One signing path (`useMemoryCovers`) instead of two divergent strategies.
- The immersive viewer is untouched (it already signs full-resolution media itself).
- The "+N more" badge keeps working.

## Out of scope (possible later follow-up — "Option B")
`useMemoryDays` still loads all media *metadata* (JSON only, no image bytes) for the list's grouping. That's cheap and not what's causing the visible lag. If it ever matters, a later change can give the list its own lean "entries grouped by day" query and make `useMemoryDays` viewer-only — independently, without redoing this work.

## Verification
- Sign into the preview; with Playwright at mobile width, load Daily, All, and Scrapbook and confirm:
  - Each view fires `render/image` (small transformed) thumbnail requests scaled to the number of **visible** rows, not the whole scrapbook.
  - All/Scrapbook no longer sign covers for off-screen entries.
- Confirm the "+N" badge still appears on entries with more than 4 media.
- Confirm the immersive viewer still opens and loads full-resolution slides.

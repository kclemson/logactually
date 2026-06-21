# Unify scrapbook rows: show every entry + fuller text

## Problem

Two different memory renderers exist:

- **Daily view** → `MemoryEntryRow` (per entry; renders text-only entries with an icon). ✅
- **All & Scrapbook views** → `MemoryTypeBody` day-summary buttons (one row per *day*, showing merged thumbnails and only the first note via `find(Boolean)`).

Consequences:
1. A text-only entry on a day that also has a media entry is folded into the day summary and its note dropped → **invisible in All/Scrapbook** (issue #2).
2. Summaries use single-line `truncate`, and the focused Scrapbook view uses these summaries instead of the media-rich per-entry row → nothing renders fuller text (issue #1).

Fix: render the All/Scrapbook memory body **per entry** using the same `MemoryEntryRow` control (grouped by date), with a `density` prop. This surfaces every entry (text-only, photo-only, video-only) everywhere and gives one row to make multi-line.

```text
Scrapbook (All / focused)
  [ View Scrapbook ]
  JUN 21, 2026
    [🖼🖼▶]  Went to put the compost out and surprised this fella.
             The weather has been amaaaaazing for the entire time
             we've been here, wow  · Anacortes            8:34 AM
    ▤  terst testasdfasdf                                  9:02 AM   <- text-only, now visible
  JUN 20, 2026
    [🖼🖼🖼]  ...
```

## Changes

### 1. `src/components/CustomLogEntriesView.tsx`
- **Export** `MemoryEntryRow` for reuse by the by-type view.
- **Multi-line text in rich density** (issue #1): when `density === 'rich'`, render the note with `line-clamp-4` (~3-4 lines) instead of `truncate`. Compact density keeps single-line `truncate` (Daily view unchanged).
- Adjust the rich layout so the timestamp/category sit sensibly with multi-line text (move time to the top-right of the thumbnail row; note becomes a full-width clamped block beneath). Compact layout untouched.
- **Caption fallback cleanup**: drop the literal `'Memory'` placeholder. Show the caption when present; for media-only entries (photo or video) show no placeholder text (category/time only). This keeps **video-only** and photo-only rows clean.

### 2. `src/components/CustomLogByTypeView.tsx`
- Thread `density: 'compact' | 'rich'` from `CustomLogByTypeView` (`focused ? 'rich' : 'compact'`) → `TypeCard` → `TypeBody` → `MemoryTypeBody`. Only `MemoryTypeBody` reads it; non-memory cards are unaffected.
- Rework `MemoryTypeBody` to:
  - Keep the **"View Scrapbook"** button on top.
  - Replace per-day summary buttons with **date-grouped per-entry rows** (same grouping as `EntryHistory`): a `MMM d, yyyy` header per day, then one `MemoryEntryRow` per entry — passing `entry.media` (already fetched by `useMemoryDays`), the `density`, and `onOpen` → `/custom/memories?type=<id>&date=<day>`.
  - Preserve the `MAX_DATES` cap and "+ N more dates" footer, plus the existing empty state.

## Media coverage (all entry shapes)
- **Text-only** → `AlignLeft` icon + caption (already handled; now visible in All/Scrapbook). 
- **Photo / mixed** → thumbnail strip (first 4) + optional caption.
- **Video-only** → `MemoryThumb` renders the poster (or first frame fallback) with a Play overlay; no placeholder caption.

## Regression analysis (scope is memory-only)
- Changes live entirely in `value_type === 'memory'` branches and `MemoryEntryRow` (used only for memory). Numeric, dual_numeric, text, text_multiline, medication, and panel/bloodwork paths are untouched.
- The `density` prop is passed through but only consumed by the memory body, so other `TypeCard`s render identically.
- No lib files change; existing tests (`memory-media`, `focused-type`, `toggle-label`, calorie/chart/portion helpers) don't cover these components and stay green.
- Cache behavior unchanged: create/delete already invalidate `['memory-days', logTypeId]` and the shared custom-log caches.

## Out of scope
- No DB/migration/RLS changes; no change to `value_type`, `memory_media`, storage, or the immersive viewer internals.
- Final pixel-level polish of the rich row beyond enabling multi-line text and clean media-only rows.
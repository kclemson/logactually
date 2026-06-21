# Immersive memory viewer: edit, tags, mobile reach, animations, stale-state fix

## 1. Fix reopening the wrong memory (#5)

**Cause:** Opening the viewer only passes `&date=`. The viewer always lands on item 0 of that day, so tapping a *different* entry on the *same* day still shows the first one.

**Fix:**
- `CustomLogEntriesView.tsx` (`MemoryEntryRow` → `onOpen`) and the date rows in `CustomLogByTypeView.tsx`: append `&entry=${entry.id}` to the viewer URL.
- `MemoryViewer.tsx`: read the `entry` param. On first data load, set `dayIndex` from the entry's day and `itemIndex` to the first built item belonging to that entry id (fallback to the existing date-based jump). This makes each row deterministically open its own memory.

## 2. `#` tag styling (#2)

- Add a small `formatTag(category)` helper (in `src/lib/memory-media.ts`): returns the category unchanged if it already starts with `#`, otherwise prefixes `#`. Stored value is never modified — display only.
- Apply in the viewer's category badge and in `MemoryEntryRow`'s category text. The composer already renders a leading `#` next to the input, so typed `#Foo` won't double up.

## 3. Mobile reach + layout rebalance (#3) + date next to caption

**Remove the top strip entirely.** The current top bar ("Scrapbook · x / y days" plus the floating date and the calendar/close buttons) adds no value and pushes interactive controls out of thumb reach. The viewer top becomes clean media with no header text.

**Date placement change:** The date currently floats top-left, far from the caption. As you swipe between days the photo/caption change but the date stays across the screen, so it's easy to lose track of *when* something was posted. **Move the date into the bottom caption block, directly above the caption/tag** so the day travels with the content it labels.

**Design reasoning (the reach tradeoff you asked for):**

```text
 Bottom action bar              Floating corner buttons
 ──────────────────             ───────────────────────
 + Everything in thumb zone     + Minimal chrome, more media
 + Structured, clear labels     + Feels "lighter"
 + Room for edit/delete/cal     - Buttons can sit over media
 - Costs vertical space         - Less discoverable, cramped
 - Close at bottom is unusual     with caption + dots + tag
```

**Recommendation: bottom action bar, with the layout rebalanced** so media is no longer hard-centered. New vertical structure top→bottom:

```text
┌───────────────────────────────┐
│                               │  no header — clean media top
│         media (fills,         │  flex region, top-weighted
│      not forced centered)     │
│                               │
│  • • • ●            (dots)    │
│  Sun, Jun 21, 2026   #tag     │  date now lives WITH the caption
│  caption text…                │
│ ┌───┬────┬──────┬───────────┐ │
│ │cal│edit│delete│      ✕    │ │  thumb-zone action bar
│ └───┴────┴──────┴───────────┘ │
└───────────────────────────────┘
```

- No top header text or top-corner buttons at all.
- Add the formatted date line into the bottom caption stack (above the caption, alongside the `#tag`).
- Add a bottom action bar (respecting `env(safe-area-inset-bottom)`) with reachable icon buttons: Calendar (jump day), Edit (pencil), Delete (trash), Close (✕). Edit/Delete hidden for read-only users; Calendar/Close always shown.
- Media region uses `object-contain` within a flex area that yields space to the bottom stack rather than centering at all costs.

## 4. Smooth slide animations between items (#4)

Yes — the existing `framer-motion` + `AnimatePresence` can do this; today only *day* swipes animate while item (photo/video) changes just swap instantly.

- Make swipe/drag and the prev/next chevrons operate at the **item** level with a directional horizontal slide (`AnimatePresence` keyed by the current item identity, `custom={direction}`, spring transition) — same feel as the day transition today.
- Crossing the first/last item of a day moves into the adjacent day automatically, so one consistent gesture spans the whole scrapbook. Dots continue to represent items within the current day.
- Videos: keep the existing tap-to-play; dragging a video still swipes (drag threshold already separates intent).

## 5. Edit an existing memory (#1 — caption, category, and media)

**New mutation** `updateMemory` (in `useMemoryMedia.ts`, exposed via `useMemoryDays`):
- Updates `custom_log_entries.text_value` + `category`.
- Diffs media against the original: delete removed `memory_media` rows (and their storage objects + posters, best-effort), upload newly-added files (reusing the existing upload/poster pipeline), and rewrite `sort_order` to match the final on-screen order.
- Invalidates `['memory-days', logTypeId]` and custom-log caches like the create/delete paths.

**Composer edit mode** (`MemoryComposer.tsx`):
- Accept an optional `editEntry` (the `MemoryEntry`). When present: title "Edit memory", prefill note + category, and seed the filmstrip with existing media (a `PendingFile` gains an `existing` variant holding `media` + a resolved signed URL; new picks stay as local `File`s). Date is fixed to the entry's logged date.
- Reordering, removing, and adding work across both existing and new items uniformly. Save calls `updateMemory` instead of `createMemory`.

**Wire-up** (`MemoryViewer.tsx`): the bottom-bar Edit button opens `MemoryComposer` in edit mode for `currentItem.entry`; on success it closes the composer and the invalidation refreshes the viewer in place.

## Technical notes / scope
- DB already allows full CRUD on `custom_log_entries` and `memory_media` (RLS verified); no migration or schema change needed.
- All changes stay within memory/scrapbook code paths — no impact on other custom log types.
- Storage cleanup for removed media is best-effort (matches the existing delete pattern).

## Files
- `src/pages/MemoryViewer.tsx` — remove top strip, date-with-caption, bottom action bar, item-level animation, entry-param landing, edit wiring, `#` tag.
- `src/components/custom/MemoryComposer.tsx` — edit mode (existing + new media).
- `src/hooks/useMemoryMedia.ts` — `updateMemory` mutation.
- `src/hooks/useMemoryDays.ts` — expose `updateMemory`.
- `src/components/CustomLogEntriesView.tsx` — `&entry=` in open URL, `#` tag in row.
- `src/components/CustomLogByTypeView.tsx` — `&entry=` in date-row open URL.
- `src/lib/memory-media.ts` — `formatTag` helper.

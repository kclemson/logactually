# Custom Log: Featured-Type View + Scrapbook rename

## Goal
Let the custom log page focus on what a user logs most often. Built generically as a "featured type" mechanism (works for any custom log type), shipped first for the photo memory feature, renamed **Photo Scrapbook**. The Scrapbook view feels more immersive via richer rows, not a forked view.

## Mental model (agreed)
- **Daily / All** stay the utilitarian list entrypoints. Memory entries appear there as rows; tapping one opens the existing immersive viewer.
- A **featured type** adds a third toggle segment = the All (by-type) view filtered to that one type. No bespoke per-type view code.
- **Log New** stays global (all types) so nothing is buried.

## Architectural guardrail (core principle)
- The list **view container** (grouping, scroll, empty/loading) stays type-agnostic.
- Per-type rendering is delegated to **type-specific row renderers** (already present: `CustomLogTypeDayRows` branches on `value_type`; memory rows use `MemoryThumb`).
- "Immersiveness" of the Scrapbook view is an **emergent property** of richer rows + a density prop, never a forked view. The line we don't cross: no `if (focused && memory) return <SpecialView>`.

## 1. Rename Memories -> Photo Scrapbook (user-facing only)
- `log-templates.ts`: template `name` `Memories` -> `Photo Scrapbook`; group label likewise.
- Internal `value_type` stays `'memory'` — no data/hook/storage churn.
- Update user-facing copy in `MemoryComposer` / `MemoryViewer` / picker to "Photo Scrapbook" (full) / "Scrapbook" (short).
- Existing "Memories"-named types keep their stored name; the label helper still maps them short.

## 2. Toggle redesign
- Small non-interactive `View:` prefix in muted text left of the segmented control.
- Labels: `Daily`, `All` (was the geeky "By Type"), and (when a featured type exists) the featured type's short label, e.g. `View: Daily · All · Scrapbook`.
- Descriptive `aria-label` per segment so short visual text keeps accessibility.
- New pure helper `getToggleLabel(type)` for the featured segment:
  - Canonical built-ins: Photo Scrapbook->Scrapbook, Body Weight->Weight, Body Fat %->Body Fat, *Measurements->existing `displayName`*, Blood Pressure->BP, Sleep->Sleep, Water Intake->Water, Bloodwork->Bloodwork, Medication->Meds.
  - Fallback: trim + truncate ~11 chars + ellipsis; full name via `aria-label`/`title`.
- Third segment renders only when a featured type is set; otherwise two segments.

## 3. Featured-type view + media-rich Scrapbook rows
- Extend `ViewMode` `'date' | 'by_type'` with `'focused'`.
- In `'focused'`, render the existing All (by-type) view scoped to the featured type (optional `filterTypeId` prop on `CustomLogByTypeView`).
- **Richer scrapbook row:** today the memory row shows a single cover (`useMemoryCovers` fetches only the first media). Extend the cover hook to return the first N media per entry and render a small **thumbnail strip** (photos/videos) in the memory row renderer.
- **Context-aware density:** the memory row takes a single `density`/`featured` prop — compact thumbs in mixed Daily/All lists, larger/more thumbs in the focused Scrapbook view. Branching lives inside the memory row component, not the shared view.
- Tapping a scrapbook entry opens the immersive viewer (existing route) — unchanged.
- Exact visual treatment of the rich row is a **design pass** (run design directions on a real screenshot once rendering); the plan commits only to the architecture (media strip + density prop).
- Last-used `viewMode` stays per-device in `localStorage` (transient lens); the featured *type* is account-level (below).

## 4. Default featured type (account-level) + settings control
- Add `defaultFocusedTypeId: string | null` to `UserSettings` (JSON `settings` blob on `profiles` — no migration).
- **Settings -> Custom Logs**: a "Default focused view" selector listing all custom log types plus **None**.
- **Seeding (generic, no scrapbook special-case):** when unset, the *effective* default is always the **most-recently-created** custom log type; if the user has no custom types, None. A stored `'none'` sentinel means explicit opt-out (don't re-seed over it).
  - Because the newest type wins, a user who just created a Photo Scrapbook lands on it automatically — the same path as any other new type, no branch needed.
- **Creation checkbox:** new-type creation gets a "Make this my focused view" checkbox (checked by default) that writes `defaultFocusedTypeId`; the settings selector changes it later.
- The default seeds where the page lands; manual toggling afterward sticks for the session and does not rewrite the saved default.

## 5. Transient switch when logging off-type
- In `'focused'`, logging a type **different** from the featured type via Log New switches the current view to the **Daily view for today** so the new entry is visible.
- Logging the featured type itself: stay put.
- Transient only — does not change the saved default; next visit returns to the featured view. The toggle moving to `Daily` is the feedback.

## Technical notes
- Files: `src/lib/log-templates.ts`; new `src/lib/toggle-label.ts` (+ test); `src/pages/OtherLog.tsx` (view state, third segment, `View:` prefix, transient switch); `src/components/CustomLogByTypeView.tsx` (optional `filterTypeId`, pass density); `src/components/CustomLogEntriesView.tsx` (`CustomLogTypeDayRows` memory row: thumbnail strip + density prop); `src/hooks/useMemoryCovers.ts` (first N media); `src/hooks/useUserSettings.ts` (new key); `src/components/settings/CustomLogTypesSection.tsx` (selector); creation dialog(s) for the checkbox; copy tweaks in `MemoryComposer`/`MemoryViewer`.
- No DB migration. No changes to `value_type`, `memory_media` schema, storage, RLS, or the immersive viewer internals.
- `getToggleLabel` and effective-default derivation are small pure functions (unit-testable).

## Out of scope
- Bottom-nav promotion / nav restructuring (deferred; page-level personalization only).
- Multiple simultaneous featured types / drag-to-reorder views (single featured type for now).
- Redesigning the immersive viewer or composer beyond the rename.
- Final visual styling of the rich scrapbook row (separate design pass).

## Verification
- 440px mobile: toggle reads `View: Daily · All · Scrapbook` without overflow; long names truncate with full name in title.
- Featuring scrapbook -> lands in the filtered Scrapbook view with media-strip rows; tapping opens the immersive viewer; same rows render compact when seen inline in Daily/All.
- Featuring a non-memory type (e.g. Bloodwork) -> lands in All filtered to that type; Log New still lists all types.
- Logging a different type from the focused view switches to Daily/today and shows the entry; logging the featured type stays put.
- Settings selector changes the default and persists across reload; None removes the third segment.
- Existing user with no stored value sees an auto-seeded third segment = their most-recently-created custom type.
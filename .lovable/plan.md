# Cohesive Canvas Composer (Create + Edit)

## Goal
Replace the stark "stage over black block" composer with one continuous, gradient-filled canvas where **writing and media are equal peers** — no harsh stripe, no caption hierarchy. The same composer serves both **creating** a new memory and **editing** an existing one (edit just opens it pre-filled).

## Architecture (validated)
- **One component, two modes.** `MemoryComposer` already handles both: create (opened from the "+ Log" button in `OtherLog.tsx`, no `editEntry`) and edit (opened from the pencil in `MemoryViewer.tsx` with `editEntry`). It stays unified — edit = the same canvas, pre-filled, running the update mutation instead of create.
- **Fork from the viewer shell.** The composer stops using `MemoryScaffold`/`MemoryStage` (those keep powering the immersive viewer slideshow, untouched). The composer renders its own full-screen canvas via `createPortal`. Viewer and composer are now genuinely different jobs (slideshow vs. input canvas), so they no longer share the shell.
- **No data/flow changes.** All existing state, handlers, mutations, signed-URL resolution, category list, date handling, and Escape-to-cancel logic are preserved exactly. This is purely presentation/layout.

## Layout
One element with the teal-to-navy gradient flowing edge-to-edge (no black bottom block).

```text
┌───────────────────────────────────┐
│ [📅 date pill]                 [X] │  header (shrink-0)
│                                   │
│  Start writing your memory…       │  large transparent textarea
│  ____________________________     │  (flex-1, scrolls)
│                                   │
│   ┌─────────────────────────┐     │  media region:
│   │   + add photo / video   │     │   empty → dashed dropzone
│   └─────────────────────────┘     │   has media → preview + filmstrip
│                                   │
│  [#category]   [actions ▸ save]   │  floating bar (lifts w/ keyboard)
└───────────────────────────────────┘
```

- **Header** (`shrink-0`): date `Popover` trigger as a teal-tinted glass pill; `X` button wired to `onCancel` (Cancel moves here, removed from the action bar).
- **Canvas** (`flex-1 overflow-y-auto`): large transparent `<textarea>`, placeholder "Start writing your memory…" (no longer framed as a caption). Media region sits below it as an equal peer.
- **Media region — multiple photos = current preview + filmstrip:**
  - No files → dashed `aspect-[4/3] rounded-3xl` dropzone button (teal `ImagePlus` chip) calling `handlePick`.
  - Has files → existing `MediaPreview` in a fixed-height `rounded-2xl overflow-hidden` card, plus the existing thumbnail **filmstrip** (select via `setIndex`, plus a dashed `+` add tile). Reuses today's index/reorder logic.
- **Floating bottom bar** (`absolute inset-x-0 bottom-0`, `bg-gradient-to-t from-black/55 to-transparent`, lifted via `useKeyboardInset`): `#category` input as a `rounded-full` pill (keep `datalist`), then `MemoryActionBar` with `[add, remove, earlier, later, save]` (same handlers/disabled rules; `cancel` removed). Inline `error` text shown just above it when present. Drop the separate progress `dots` — the filmstrip already shows the current item.

## Edit-mode behavior
Identical canvas. When `editEntry` is set, fields are pre-populated (note, media, category, date) and Save runs the update mutation — already wired today. The empty canvas reads as "new page" (create); the pre-filled canvas reads as "same page with your stuff on it" (edit).

## Files
- **New `src/hooks/useKeyboardInset.ts`** — extract the existing `useKeyboardInset` hook (currently private in `MemoryScaffold.tsx`) so both the scaffold and the new composer can lift their bottom chrome above the on-screen keyboard. `MemoryScaffold.tsx` imports it from here, unchanged behavior.
- **Rewrite `src/components/custom/MemoryComposer.tsx`** — new cohesive-canvas layout per above; all state/handlers/mutations preserved.
- No changes to `MemoryViewer.tsx`, `MemoryScaffold.tsx` shell behavior (beyond the hook import), `OtherLog.tsx` wiring, or any data layer.

## Verification
- Open "+ Log" on a memory type → one continuous gradient, no black stripe/seam.
- Empty state shows writing area and add-media dropzone as equal peers.
- Add multiple photos → preview + filmstrip select/reorder work.
- Date pill opens the calendar; `#category` autocompletes.
- Save/Saving and inline error states work for **both** create and edit (open via the viewer's pencil → fields pre-filled, Save updates).
- On mobile, focusing the note keeps the bottom bar above the keyboard.

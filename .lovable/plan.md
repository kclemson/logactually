# Unify scrapbook view & edit via shared layout primitives

## Problem
The immersive viewer (`MemoryViewer.tsx`) has **no top chrome** — media fills the screen, and everything else (progress dots, date + tag, caption, and an action row of Calendar / Edit / Delete / Close) lives in one bottom block.

The editor (`MemoryComposer.tsx`) reintroduces a **top bar** (close, date chip, reorder & remove), top progress dots, a top scrim, and side chevrons. Tapping Edit shifts the whole layout and controls jump to the top.

Goal: viewer and editor present an **identical hierarchy** by sharing layout primitives, while each keeps its own state/orchestration (read-only navigation vs. mutable draft). Plus: make the entry date editable by tapping it.

## Architecture
Extract three shared presentation primitives; Viewer and Editor become thin orchestrators that fill them.

```text
MemoryScaffold (full-screen black shell)
├── stage slot      → MemoryStage (blurred backdrop + object-contain + swipe/chevrons)
└── bottom slot     → progress dots → date row → caption slot → MemoryActionBar
```

### a. `MemoryStage` — `src/components/custom/MemoryStage.tsx`
Media presentation extracted from the viewer's `MediaSlide`/`SlideContent`: blurred backdrop, `object-contain` media, optional side chevrons, and `framer-motion` drag-to-swipe between items. Props: current media/preview source(s), `hasPrev`/`hasNext`, `onPrev`/`onNext`, `direction`. Accepts either a signed-URL (viewer) or an object-URL/loading preview (editor) so both render media in the exact same place.

### b. `MemoryScaffold` — `src/components/custom/MemoryScaffold.tsx`
The full-screen `fixed inset-0 z-50 bg-black` shell + bottom-block layout (dots → date row → caption → action bar) as slots:
```ts
interface MemoryScaffoldProps {
  stage: ReactNode;        // MemoryStage
  dots?: ReactNode;        // progress dots
  dateRow: ReactNode;      // date (+ tag/category) line
  caption?: ReactNode;     // read-only text OR textarea
  actions: ReactNode;      // MemoryActionBar
  error?: ReactNode;
}
```
Owns the bottom gradient, safe-area padding, and keyboard-inset lift (`useKeyboardInset` moves here from the composer) so both surfaces handle the on-screen keyboard identically.

### c. `MemoryActionBar` — `src/components/custom/MemoryActionBar.tsx`
The single config-driven action row. Takes an ordered list of descriptors and renders the viewer's existing thumb-zone styling; `align: 'end'` actions push right; one optional `prominent` action renders a filled teal pill (Save).
```ts
export interface MemoryAction {
  key: string;
  icon: LucideIcon;
  label: string;              // aria-label
  text?: string;              // shown when prominent (e.g. "Save")
  onClick: () => void;
  disabled?: boolean;
  align?: 'start' | 'end';    // default 'start'; first 'end' gets ml-auto
  tone?: 'default' | 'danger';
  prominent?: boolean;        // filled teal pill
  busy?: boolean;             // spinner instead of icon
}
```

## Viewer (`MemoryViewer.tsx`)
Recompose onto the shared primitives — no visible change:
- Render `MemoryScaffold` with `MemoryStage` (current item), dots, date + tag row, read-only caption, and `MemoryActionBar`:
  - start: Calendar (jump-to-day), Edit, Delete (danger) — Edit/Delete hidden when read-only
  - end: Close
- Keep all existing navigation/state logic (`computeStart`, day/item indices, calendar overlay, keyboard nav).

## Editor (`MemoryComposer.tsx`)
Recompose onto the same primitives so nothing shifts when entering edit:
- **Remove** the top bar, top scrim, top progress dots, and top-positioned reorder/remove buttons.
- Render `MemoryScaffold` with `MemoryStage` (current preview, swipeable), dots, date row, caption **textarea**, filmstrip, and `MemoryActionBar`:
  - start: Add media (ImagePlus), Remove current (Trash2, danger, disabled when no media), Move earlier (ArrowLeft, disabled at first), Move later (ArrowRight, disabled at last)
  - end: Cancel (X), Save (prominent teal pill, `busy` while saving, disabled until `canSave`)
- Keep the filmstrip (thumbnail select + "＋ add") and all draft state (note/category/files/index/upload progress).
- Media now uses `MemoryStage` (`object-contain` + blurred backdrop), matching the viewer's placement.

## Editable date (tap-to-change, edit mode only)
- In the editor's date row, the date becomes a button opening a shadcn `Popover` + `Calendar` (`@/components/ui/popover`, `@/components/ui/calendar`); calendar wrapper gets `pointer-events-auto` to work inside the dialog.
- Selecting a date updates new local `loggedDate` state (seeded from `editEntry.logged_date` via `useState(() => ...)`). Passed to the mutation on Save.
- Extend `useUpdateMemory` (`src/hooks/useMemoryMedia.ts`): write `logged_date: loggedDate` in the `custom_log_entries` update; add `originalDate` to params and, when the date changed, invalidate custom-log caches for **both** old and new dates (the `memory-days` query is already invalidated wholesale).
- The viewer's displayed date stays read-only; its Calendar action remains the jump-to-day picker.

## Technical notes
- No backend/schema changes — `logged_date` already exists; only the update mutation widens what it writes.
- Follows useEffect guidance: `loggedDate` is local state seeded from props, no sync effects; `useKeyboardInset` stays an effect (subscribes to `visualViewport`, an external system).
- Read-only users can't reach the editor; Save/destructive actions stay gated via existing `disabled`/`isReadOnly`.

## Files
- `src/components/custom/MemoryStage.tsx` — new shared media stage
- `src/components/custom/MemoryScaffold.tsx` — new shared shell + bottom-block layout
- `src/components/custom/MemoryActionBar.tsx` — new shared, config-driven action bar
- `src/pages/MemoryViewer.tsx` — recompose onto shared primitives
- `src/components/custom/MemoryComposer.tsx` — recompose onto shared primitives, tap-to-edit date
- `src/hooks/useMemoryMedia.ts` — persist `logged_date` + date-aware cache invalidation

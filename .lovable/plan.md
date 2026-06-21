## Goal
Give the **memory** custom-log type a bespoke, photo-first composer that feels cinematic and diary-like — full-bleed imagery, overlaid caption — while keeping it **fully isolated** from the utilitarian custom-log dialogs (numeric, text, medication, bloodwork), which stay exactly as they are.

## Decisions (settled with you)
- **Surface:** full-screen takeover on mobile, large centered card on desktop.
- **Caption:** overlaid on the photo (Stories-style) over a gradient scrim.
- **Text-only memories:** one fixed tasteful gradient backdrop.
- **Scope:** redesign the composer **and** add a leading thumbnail to the "By Date" memory row.

## Architecture — keep memory isolated
Today `OtherLog.tsx` (the `/custom` page) is a dispatcher that wraps **every** log type in one shared compact `<Dialog><DialogContent className="...max-w-sm top-[5%]...">` (around lines 363–365), then renders `<MemoryEntryInput/>` for memories inside it.

Change: the memory branch no longer uses that shared wrapper. It renders a new self-contained `<MemoryComposer/>` that owns its **own** dialog shell. The shared `<Dialog>` continues to wrap only the utilitarian types — untouched, so they cannot be affected.

```text
dialogType.value_type === 'memory'
   ? <MemoryComposer ... />              // own immersive shell
   : <Dialog><DialogContent compact>     // existing, unchanged
       medication / panel / numeric / text
     </DialogContent></Dialog>
```

`MemoryComposer` is still built on the shadcn/Radix Dialog primitive (so focus-trap, Escape, scroll-lock, aria come free) but with its **own** `DialogContent` styling — separate classes, no sharing with the compact dialog.

## Composer UX
**Shell (responsive)**
- Mobile: `inset-0` edge-to-edge takeover, respects notch/home-indicator via `env(safe-area-inset-*)`, slides up.
- Desktop: centered card (~`max-w-[600px]`, tall) on a dimmed cinematic backdrop, fades + scales in.
- Top bar over the image: the date being logged to ("Today" / selected date) + a clear ✕ close.

**Empty state (photo-first)**
- One large rounded "canvas" with a soft gradient and a single "Add photos or video" affordance front and center; caption sits quietly below. Both photo and caption remain optional.

**With media (full-bleed)**
- First item becomes a full-bleed hero: mobile `object-cover` edge-to-edge behind top/bottom scrim; desktop `object-contain` at large size (never awkwardly cropped).
- Multiple items → swipeable gallery with Stories-style progress dots, plus a slim filmstrip of thumbnails and a "＋ add" control.
- Videos show a play glyph + duration over their poster frame.
- Remove/reorder as small floating glass buttons over the current image (no cramped grid).

**Caption + category (overlaid)**
- Borderless, diary-style caption input floating over the scrim; category as a subtle inline "#tag"-style chip. Strong scrim ensures legibility.

**Text-only memory (no photo)**
- One fixed tasteful gradient backdrop with the caption centered and enlarged, so written-only entries look intentional. Same backdrop logic is reused for consistency.

**Save**
- Single primary **Save** pinned bottom over the scrim (teal accent). Inline upload progress using the existing per-file status, then the takeover dismisses back to `/custom`. Close is the ✕.

**Motion (framer-motion, already installed)**
- Open (slide-up / scale-fade), new photo scales+fades into hero, swipe crossfades, save dismisses smoothly. Restrained — a couple of deliberate moments.

## By-Date row polish
In `CustomLogEntriesView` (the "By Date" rendering), add a small leading thumbnail (first photo, or the text-only gradient swatch) to memory rows so they read visually in the list. "By Type" view is left as-is.

## Out of scope (unchanged)
`useCreateMemory`, the `memory_media` table, storage bucket, RLS, and `MemoryViewer`. No sharing/collaboration. No new fonts. No changes to any other custom-log type or the shared compact dialog.

## Technical notes
- New file `MemoryComposer.tsx` (own Radix-based shell + full-bleed layout). Existing composer logic from `MemoryEntryInput.tsx` (create mutation wiring, category suggestions via `existingCategories`, per-file upload tracking) is reused/migrated into it; the old plain layout is replaced.
- `OtherLog.tsx`: branch the memory case out of the shared `<Dialog>` and mount `<MemoryComposer/>` with the same props it passes today (`label`, `logTypeId`, `loggedDate`, `existingCategories`, `onSuccess`, `onCancel`, `disabled`).
- Gesture handling: vertical drag = dismiss (mobile), horizontal drag = navigate gallery; if they conflict in practice, drop swipe-to-dismiss and keep the ✕.
- Use semantic design tokens (teal accent already in the system); no hardcoded color utilities.

## Verification
Drive the composer on a 390px mobile viewport and a desktop viewport via Playwright: empty state → add a sample photo (full-bleed hero) → multi-photo gallery → text-only gradient → save. Screenshot each to confirm the photo-first feel and that the utilitarian dialogs are visually unchanged. Also screenshot the "By Date" list to confirm the new memory thumbnail.
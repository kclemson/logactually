# Pin icon should reflect actual Quick Add membership

## The problem

In Settings, the pin icon next to each saved meal/routine only reflects **manual pins** (`quickAddPinned`). Items that show up in Quick Add because they were auto-detected as habitual (the demo account's case) still render an unpinned icon — so the settings list disagrees with what the user sees on the log page.

## What to change

Make the icon answer "is this in my Quick Add list right now?" with three states:

- **Auto-detected (in the list, not manually pinned)** — filled pin in a muted color. Tooltip: "In Quick Add (automatic) — tap to remove".
- **Manually pinned (in the list)** — filled pin in primary color. Tooltip: "Pinned to Quick Add — tap to remove".
- **Not in the list** — current outlined `PinOff`. Tooltip: "Pin to Quick Add".

Tap behavior becomes a straight in/out toggle:

- In the list (either reason) → remove from `quickAddPinned`, add to `quickAddHidden`.
- Not in the list → add to `quickAddPinned`, remove from `quickAddHidden`.

If Quick Add is disabled in preferences, keep showing only manual-pin state (auto detection isn't running).

## Technical notes

- `SavedMealsSection.tsx` / `SavedRoutinesSection.tsx` call the existing `useQuickAddFood([], true)` / `useQuickAddRoutines([], true)` hooks to get the currently selected ids (passing no already-logged ids so the settings view isn't day-dependent), and pass `isPinned` plus a new `pinSource: 'manual' | 'auto' | null` down to `SavedItemRow`.
- `SavedItemRow.tsx` gains the `pinSource` prop and renders the three icon states / labels; no other row consumers change (prop is optional).
- Toggle handlers in both sections updated to the in/out logic above.
- No schema or backend change; selection logic in `src/lib/quick-add.ts` stays as-is.

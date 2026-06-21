## Fix: brief flash of previous memory when opening a different entry on the same day

### What's happening

Tapping a memory navigates to `/custom/memories?...&entry=<id>`, which **remounts** `MemoryViewer`. The `memory-days` data is cached by React Query, so on the very first render `days` is already populated — but the viewer's state starts at `dayIndex = 0 / itemIndex = 0` (i.e. the day's first entry, often the previously-viewed entry A). A `useEffect` then jumps to the requested `entry` **after** the first paint, so the browser paints one frame of entry A before correcting to entry B.

### The fix

Compute the correct starting position up front instead of correcting it after paint, so the right memory is shown from the first painted frame.

1. **Extract a `computeStart(days, initialDate, initialEntry)` helper** in `MemoryViewer.tsx` that returns `{ dayIndex, itemIndex }` using the existing "prefer explicit entry, else date, else 0" logic.

2. **Lazy-initialize the index state** with it: `useState(() => computeStart(days, initialDate, initialEntry))`. When the data is already cached (the same-day case the user hit), the indices are correct on the first render — no flash, no effect needed.

3. **Replace the post-paint `useEffect` with the cold-load case only**: when the viewer mounts before data has loaded (`days` empty on first render), apply `computeStart` once data arrives using `useLayoutEffect` (runs before the browser paints), still guarded by `startedRef`. During cold load the viewer already shows the "Loading…" state, so no stale entry is ever visible.

This aligns with the project's useEffect guidance (compute initial/derived state rather than syncing it via an effect) and keeps all later navigation (swipe, chevrons, calendar) working off the same state.

### Files

- `src/pages/MemoryViewer.tsx` — add `computeStart`, lazy-init `dayIndex`/`itemIndex`, swap the jump `useEffect` for a guarded `useLayoutEffect` that only fires when the lazy init couldn't resolve a target (cold cache).

No backend, query, or other component changes.
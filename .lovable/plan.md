# Fix: "likely finished" never triggers

## What's wrong

The idle check in `useDemoPopulateProgress` runs inside a `useEffect` whose dependency is the `counts` **object**. React Query's structural sharing keeps the exact same `counts` object reference when a poll returns identical numbers (only the sibling `at` timestamp changes). So:

1. First poll where counts repeat: effect runs, sees signature unchanged, but only ~3s have passed since the last change, so it does nothing.
2. Every later identical poll: `counts` reference is unchanged, so the effect never runs again.
3. The 60-second idle condition is therefore never re-evaluated, and the panel stays blue with a ticking "last checked" time forever.

A second, related display bug: the snapshot list skips appending when counts are identical, so the last two snapshots stay the last two *different* ones. That's why the `+#` deltas keep showing stale non-zero values instead of falling to zero.

## The fix

In `src/hooks/useDemoPopulateProgress.ts`:

- Key the idle-detection effect on the poll timestamp (`query.data?.at`) instead of the `counts` object, so it re-evaluates on every poll regardless of reference identity. Read counts from a ref/local inside the effect.
- Append a snapshot on every poll (including unchanged ones) so deltas reflect the actual last-two-poll difference and drop to `+0` (i.e. hidden) once population stops. Cap the retained history at a small number of entries.

No changes to the 3s poll interval, the 60s idle window, or the 15-minute cap. No UI/copy changes in `DemoPopulateProgress.tsx`.

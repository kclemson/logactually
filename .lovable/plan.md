Add per-poll delta badges to the demo data population progress panel

## Goal
On the Admin page, while a demo-data population run is in progress, show a `+#` next to each live count (Food entries, Exercise sets, etc.) indicating how much that count changed between the most recent poll and the previous poll.

## Current state
- `src/hooks/useDemoPopulateProgress.ts` polls `get_user_stats` every 3 seconds and exposes the latest counts, but it only keeps one signature string for idle detection. It has no memory of the previous poll's numeric values.
- `src/components/DemoPopulateProgress.tsx` renders the counts as a plain bulleted list.

## Plan

1. **Track previous counts in the hook**
   - Replace `lastSignature` with a `previousCounts` ref of type `DemoProgressCounts | null`.
   - On each successful poll, compute a `deltas` object by subtracting each field of `previousCounts` from the new `counts`.
   - After computing deltas, store the new counts into `previousCounts` for the next poll.
   - Expose `deltas` alongside `counts` from the hook. If there is no previous poll yet, return zero deltas.

2. **Render deltas in the progress UI**
   - In `DemoPopulateProgress.tsx`, for each count row show a small delta badge when the delta is positive, e.g. `Food entries: 1,247  +12`.
   - Use the existing blue/green text color so the badge matches the banner state.
   - Omit the badge when the delta is `0` or negative (population should only grow; a negative value would be noise).

3. **Verify**
   - Run the TypeScript typecheck.
   - If there are existing tests for `useDemoPopulateProgress`, update them to assert that the second poll returns the expected deltas.

## Out of scope
- No backend or edge-function changes.
- No changes to the "likely finished" heuristic or polling interval.

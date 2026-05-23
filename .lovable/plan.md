# Fix retry UX in Settings failed-bloodwork list

## Problem
Clicking the retry icon on a failed bloodwork upload in Settings makes the row disappear immediately, even while the parse is still running. If the parse fails again, the row only reappears after the refetch settles — and to the user it looks like the retry did nothing / lost their file.

Root cause: `useFailedBloodworkPanels.retryParse` has an `onMutate` that optimistically filters the panel out of the failed list. Since the list is "failed only", removing it on mutate hides it for the entire duration of the parse.

## Change
`src/hooks/useBloodworkPanels.ts`, `useFailedBloodworkPanels.retryParse`:
- Remove `onMutate` and `onError` (no more optimistic removal).
- Keep `onSettled` invalidation so the list refreshes once the edge function returns.
- The retry button in `CustomLogTypeRow` already shows a `Loader2` spinner while `retryParse.isPending && variables === p.id`, so the user gets immediate feedback that the retry is in flight, and the row stays visible until the real status is known.

Result:
- Click retry → spinner appears on that row's retry icon, row stays put.
- Parse succeeds → row disappears (no longer failed).
- Parse fails again → row stays with updated `parse_error`.

`deletePanel` keeps its optimistic removal (delete is user-initiated and final, so instant removal is the correct UX there).

## Out of scope
- Daily-view behavior (already correct).
- Why parses fail.

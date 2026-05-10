## Goal

Make it visually clear that the Saved Meals / Saved Routines dropdown is scrollable when it overflows, by ensuring the last visible row is partially clipped instead of aligning perfectly to the container's bottom edge.

## Problem

Both popovers use `max-h-64` (256px) for the scroll area, and each row is ~28px tall (`px-3 py-1.5` + `text-xs`). 256 / 28 ≈ 9.14, so rows fit nearly flush — there's no half-row peek to signal more content below.

## Change

In `src/components/SavedMealsPopover.tsx` and `src/components/SavedRoutinesPopover.tsx`, change the scroll container from:

```
max-h-64
```

to a height that intentionally lands mid-row, e.g.:

```
max-h-[232px]
```

That's ~8.3 rows — 8 full rows visible plus a clear half-row peeking at the bottom, which is the standard scroll affordance pattern.

## Out of scope

- No row height, font size, padding, or width changes.
- No changes to the search bar, "Add New" header, or empty state.
- No changes to `LogInput.tsx`.

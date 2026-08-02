# Quick Add rows: name only

Drop the numeric cells from Quick Add ghost rows. These are one-tap shortcuts for items the user logs constantly, so the calories / sets / reps / weight columns add clutter without adding information — and removing them lets nearly every name fit on a single line.

## Changes

**`src/components/QuickAddGhostRows.tsx`**
- Remove the `cells` field from `QuickAddItem` and the `gridCols` prop.
- Replace the grid row with a simple flex row: `+`/pin icon + name on the left, `...` menu pinned to the right.
- Name goes back to single-line `truncate` (with the existing `title` tooltip for the full name) since there's now full row width available.
- Keep the small `text-xs` italic muted styling, accents, pin/hide/disable menu, and pending spinner unchanged.

**`src/pages/FoodLog.tsx`**
- Drop the `gridCols` prop and the calorie-sum `cells` mapping; items become `{ id, name }`.

**`src/pages/WeightLog.tsx`**
- Drop the `gridCols` prop and the sets/reps/max-weight `cells` mapping (and the now-unused per-item aggregation); items become `{ id, name }`.

No changes to selection logic, hooks, or settings.

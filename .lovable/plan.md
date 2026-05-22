## Problem

Each lab result row in `BloodworkPanelGroup` is its own CSS Grid. The reference-range column uses `auto`, so it sizes to that row's content. Rows with wider ranges (e.g. `11.1–15.9`) push the value column over, producing the misalignment you're seeing. Units are not the cause — the per-row `auto` track is.

## Fix

Stop letting each row compute its own columns. Define one column template once on the rows container and have every row inherit it, so all values and ranges align on shared vertical edges.

1. **Single shared grid template**
   - On the rows wrapper (parent of all result rows), apply `grid grid-cols-[minmax(0,1fr)_6rem_5rem] gap-x-3`.
   - Each row becomes `display: contents` (or just three direct children of the wrapper), so its three cells participate in the parent grid instead of creating their own.

2. **Three simple cells per row**
   - Cell 1 (test name): left-aligned, truncates as needed.
   - Cell 2 (value + flag): fixed `6rem` track, left-aligned, `tabular-nums whitespace-nowrap`. Flag (H/L) rendered inline next to the value, only when present. No units rendered.
   - Cell 3 (reference range): fixed `5rem` track, right-aligned, muted, `tabular-nums whitespace-nowrap`. Long ranges truncate inside their fixed track instead of resizing the column.

3. **Remove per-row grid leftovers**
   - Delete the row-level `grid grid-cols-[...]` class currently on each result row.
   - Keep existing colors, abnormal H/L styling, hover/click behavior, and spacing tokens unchanged.

4. **Verify**
   - Reload the panel, confirm all values share one vertical edge and all reference ranges share another, regardless of range width.

## Scope

- Only `src/components/BloodworkPanelGroup.tsx` row/list markup and classes.
- No data, no business logic, no unit handling changes.

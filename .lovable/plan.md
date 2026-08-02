# Quick Add ghost rows: smaller, less-truncated text

Ghost rows are one-tap entry points, not real log entries, so they don't need to match the entry row's type scale. Shrinking the text lets longer saved meal / routine names fit before truncating.

## Changes (all in `src/components/QuickAddGhostRows.tsx`)

- Name label: drop to `text-xs` (from inheriting the row's base size), keep italic + muted, keep `truncate` as the last-resort fallback.
- Allow two lines before truncating so long names like "Barebell bar - Cookie Dough" stay readable: `line-clamp-2` with `leading-tight` instead of single-line `truncate`.
- Metric cells: drop to `text-[11px]` so the numbers stay visually subordinate and aligned with the smaller name.
- Tighten row vertical padding slightly (`py-0.5`) so the smaller text doesn't leave the rows looking airy, while keeping the tap target at a comfortable height via `min-h-[28px]`.
- Icons stay at `h-3 w-3`; the `...` menu button stays the same size so the hit target is unaffected.

No changes to the grid templates in `FoodLog.tsx` / `WeightLog.tsx`, to selection logic, or to hooks — the ghost rows still align to the same columns as real entries.

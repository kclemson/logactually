In `src/components/BloodworkPanelGroup.tsx`, align all blood test result values into a single fixed-width column for cleaner visual scanning.

1. Change the result row grid from `grid-cols-[1fr_auto_auto]` to `grid-cols-[1fr_3.5rem_auto]` so the value column has a consistent 3.5rem width.
2. Add `text-right` to the value `<span>` so numbers align cleanly on the right edge of that fixed column.
3. Keep the reference range in its own auto-sized column and preserve H/L flag coloring.

No backend or data changes — purely a layout refinement in the summary list view.
The values are still rendering right-aligned because the value cell is a `<span>` (inline) and the inner content is also a span — `text-left` isn't taking effect reliably in the grid cell.

Fix in `src/components/BloodworkPanelGroup.tsx` (around lines 165–185):
1. Change the value cell from `<span>` to `<div>` so it's a block-level grid item.
2. Add `justify-self-start` to that cell so it explicitly hugs the left edge of its 3.5rem track instead of stretching.
3. Keep `tabular-nums whitespace-nowrap` for alignment, drop redundant `text-left`.
4. Leave name and reference-range cells unchanged.

This guarantees every numeric value starts flush at the same left edge of the value column, with the H/L flag sitting to the right of the number when present.
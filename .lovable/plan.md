Give analyte names more horizontal space by tightening the value and reference columns.

Both bloodwork result grids currently use `grid-cols-[minmax(0,1fr)_5rem_4rem]`. The 5rem value column and 4rem reference column reserve more width than typical numeric content needs, so names like "Alkaline Phosphatase", "% Immature Granulocytes", and "Absolute Lymphocytes" get truncated even though there's empty space to the right of each value.

Change in `src/components/BloodworkPanelGroup.tsx` at the two grid sites (lines 235 and 370):

- Update grid template to `grid-cols-[minmax(0,1fr)_3.5rem_3.5rem]`, freeing ~2rem for the name column.
- Value column stays left-aligned (the value sits flush at the start of its column, right next to the name), preserving `tabular-nums whitespace-nowrap`. The optional `High`/`Low` flag continues to render inline after the number.
- Reference column keeps its existing `text-right` alignment.
- Apply the same template to both the flat filtering view and the expanded section view so they stay consistent.

No logic changes.
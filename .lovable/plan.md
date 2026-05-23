# Align failed-bloodwork row icons with parent row icons

## Problem
The retry/delete icons on the failed-upload row sit slightly off from the edit/delete icons on the parent log-type rows above. Cause: my row uses `p-1` button padding while `SavedItemRow` uses `p-0.5`, so the icons end up at a different horizontal position (and slightly larger hit boxes).

## Change
`src/components/CustomLogTypeRow.tsx`, in the failed-panels list:
- Change the retry and delete button padding from `p-1` to `p-0.5` to match `SavedItemRow`'s icon buttons exactly.
- Keep the same icon sizes (`h-3.5 w-3.5`) and the same gap.

That's it — the right edge already aligns because the indented `<ul>` shares the parent row's right edge; only the button padding was throwing things off.

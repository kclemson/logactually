# Fix Quick Add chip hover flicker

## What's happening

The chips expand to their full name on hover. Expanding changes the chip's width, which re-flows the whole wrapped row — chips shift position, the pointer can end up off the chip, hover turns off, the chip shrinks back, the pointer lands on it again. That loop is the flicker.

## The fix

Stop hover from changing layout. The full name still needs to be reachable on desktop, so:

- Remove the hover-expansion state (`hoverId`, mouse enter/leave/focus handlers) from `QuickAddRow`.
- Always render the shortened, word-boundary name.
- Keep the native `title={item.name}` tooltip on the chip button, which already shows the full name on desktop hover with zero layout impact.
- Keep the hover background-color change (color-only, no reflow) and the pinned-chip styling as they are.

`useHasHover` is no longer needed in this component.

## Technical notes

Only `src/components/QuickAddRow.tsx` changes. `shortenChipName` and its tests stay as-is.



## Shrink typeahead suggestion font size

**`src/components/TypeaheadSuggestions.tsx`** — reduce the font size of suggestion rows from `text-sm` to `text-xs`, keeping the layout and touch targets intact:

- Change the button's `text-sm` class to `text-xs` (line ~76)
- This keeps the row height/padding unchanged (still tappable) but fits longer descriptions like "Brown Sugar Cinnamon Protein Bar" without truncation


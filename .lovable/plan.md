
## Align Right-Side Input Controls

### Problem
The input boxes and their trailing context (unit labels, toggles) aren't consistently aligned across rows. Each row has a different right-column width, making the layout look uneven.

### Solution
Use a consistent fixed-width right column (`rightColClass`) across all rows that have inputs, ensuring the input box + any trailing context (lbs/kg, in/cm, /10) always occupies the same horizontal space. Rows without a trailing suffix (like Age) will still reserve that space to keep alignment.

### Technical Details (`src/components/CalorieBurnDialog.tsx`)

1. **Widen `rightColClass`** from `w-[7.5rem]` to `w-[8.5rem]` to comfortably fit the input + unit suffix/buttons for all rows.

2. **Standardize trailing suffix width**: Give all trailing elements (the `lbs`/`kg` span, the `in`/`cm` button group, and the `/10` span) a consistent fixed width (e.g., `w-8` or `w-10`) so inputs always end at the same position. For Age, add an empty spacer `<span className="w-8" />` to maintain alignment even though there's no suffix.

3. **Make all input widths consistent**: Currently body weight uses `w-20`, height uses `w-16`, intensity uses `w-14`. Standardize them all to `w-16` so the boxes themselves are the same size, with the trailing context taking up the remaining space.

Specifically:
- **Body weight row** (line ~275-286): Input `w-16`, trailing `<span className="text-xs text-muted-foreground w-8">{settings.weightUnit}</span>`
- **Height row** (line ~295-321): Input `w-16`, trailing in/cm buttons wrapped in `<div className="w-8 flex justify-end gap-0.5">`
- **Age row** (line ~330-341): Input `w-16`, trailing `<span className="w-8" />` (empty spacer)
- **Default intensity row** (line ~377-389): Input `w-16`, trailing `<span className="text-xs text-muted-foreground w-8">/10</span>`

### Files Changed
- `src/components/CalorieBurnDialog.tsx` only

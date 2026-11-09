# Fix the label wrapping in the calendar's "Show on each day" menu

On phones, "Bottom line" breaks onto two lines because the "Activity icons" dropdown pushes it over.

## Change
- Rename the labels to "Top" and "Bottom", since the heading already says "Show on each day".
- Make the labels never wrap, and make the menu slightly wider (about 240px instead of 224px). Both rows then fit on one line with "Activity icons" selected.

## Technical notes
- In `src/pages/History.tsx`, in the calendar settings menu: change the label text, add `whitespace-nowrap` to the label span, and change `w-56` to `w-60`.

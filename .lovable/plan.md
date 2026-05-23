## Problem

Analyte names truncate in the expanded bloodwork view even with empty space to the right. The row grid is `[minmax(0,1fr)_6rem_5rem]` — 6rem reserved for values like "5.9" is way more than needed.

## Plan

Keep the fixed-column layout (so values stay vertically aligned in one tidy column), but shrink the reservations to match actual content.

In `src/components/BloodworkPanelGroup.tsx`, change both grid templates (line 219 filter-active block and line 354 expanded block) from:

`grid-cols-[minmax(0,1fr)_6rem_5rem]`

to:

`grid-cols-[minmax(0,1fr)_3.5rem_4rem]`

Sizing rationale:
- **Value column 3.5rem (~56px)**: fits typical 3–4 char numbers like "47.6" or "318". The "High"/"Low" flag label sits to the right of the value but uses `whitespace-nowrap`, so it can overflow into the gap — that's fine since the next column has its own start position. Actually safer: keep value cell content together by letting flag wrap below… no — better to budget for it. Use **5rem** instead, which fits "47.6 High" (the widest realistic case).
- **Ref column 4rem (~64px)**: fits "150–450", "11.7–15.9", "Not Estab." — the current "Not Estab." at text-[10px] measures ~4rem.

Final values: `grid-cols-[minmax(0,1fr)_5rem_4rem]` — reclaims ~2rem (~32px) for the name column while keeping perfect vertical alignment of both numeric columns.

## Out of scope

- No changes to colors, flags, spacing, or any other layout.

## Goal

Make the popover container slightly taller so the peeked row's **text** sits under the bottom fade — eliminating the "two parallel lines" look (row divider + container border) with empty space between them.

## Change

In both `src/components/SavedMealsPopover.tsx` and `src/components/SavedRoutinesPopover.tsx`, change the scroll container from `max-h-[14.5rem]` (232px) to `max-h-[15.5rem]` (248px).

## Math

Row anatomy (37px total): 10px top padding · 16px text · 10px bottom padding · 1px border.

- Current `max-h-[14.5rem]` (232px) → 6 rows (222px) + 10px peek. That 10px is exactly the top padding of row 7 — pure whitespace, no text. Result: divider line at 222px, container edge at 232px, with nothing between them.
- New `max-h-[15.5rem]` (248px) → 6 rows (222px) + 26px peek. Peek now covers row 7's top padding (10px) **and the full text band (16px)**. The 24px `from-popover` fade overlays the bottom 224–248px, fading the text out gracefully instead of clipping empty whitespace.

## Out of scope

- Row padding (`py-2.5`) unchanged.
- Fade gradient and `showBottomFade` logic unchanged.
- No other components touched.

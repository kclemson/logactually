## Goal

Tighten the saved meals and saved routines dropdowns on the logging pages so each item takes a single row instead of two, reducing scroll for users with many saved items.

## Data check

Looked at the longest names in the DB:

- **Saved meals**: max 45 chars ("GOLD STANDARD 100% WHEY Double Rich Chocolate"), most ≤30
- **Saved routines**: max 37 chars ("Shoulder Press Machine (3x8 @ 15 lbs)"), most ≤26

The popover is 288px wide (`w-72`). Long names will need truncation in some cases, but at a smaller font size the typical name (~25 chars) fits comfortably alongside a right-aligned metadata chip.

## Layout change

Convert each row from a two-line stack:

```
[ Name (font-medium)              ]
[ 3 items • 420 cal (text-xs muted)]
```

…into a single row with name on the left (truncating) and metadata right-aligned and de-emphasized:

```
[ Name (text-xs, truncate)        3 items · 420 cal ]
```

Specifics:
- Name: `text-xs` (was default/`font-medium` at `text-sm`), keep `font-medium`, `truncate`, `flex-1 min-w-0`
- Meta: `text-[11px] text-muted-foreground tabular-nums shrink-0` to the right of the name
- Row padding: reduce to `px-3 py-1.5` (was `py-2`) — still meets touch-target since the entire row is clickable and the popover is mouse/finger reachable
- Loader spinner stays inline (replace the meta chip when logging that row)

Hit target stays the full row width, so the smaller text doesn't hurt tappability.

## Files to change

- `src/components/SavedMealsPopover.tsx` — collapse the meal row to one line; show `N items · N cal` on the right
- `src/components/SavedRoutinesPopover.tsx` — same pattern; show `N exercise(s)` on the right
- "Add New Meal/Routine" header row and the empty/search states stay as they are (already single-row)

## Out of scope

- No changes to the popover width, the trigger button, or the underlying hooks/data
- No changes to other places that render saved item rows (settings list, suggestion prompt)

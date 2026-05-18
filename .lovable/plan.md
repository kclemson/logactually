## Goal

Add vertical breathing room to each row in the saved meals and saved routines popovers, while keeping a visible half-row peek + fade at the bottom so users see the scroll affordance when the list overflows.

## Changes

In both `src/components/SavedMealsPopover.tsx` and `src/components/SavedRoutinesPopover.tsx`:

1. **Row padding**: bump item buttons from `px-3 py-1.5` to `px-3 py-2.5`. The header "Add New …" button stays at `py-2` to remain visually distinct from list rows.

2. **Scroll container max-height**: change `max-h-64` (256px) to `max-h-[14.5rem]` (232px) so overflow ends mid-row.

### Math (why 14.5rem)

- New row height: text-xs (~16px line-height) + `py-2.5` (10px × 2) + 1px border ≈ **37px per row**.
- `max-h-64` (256px) ÷ 37 ≈ 6.9 rows → only ~3px of a 7th row peeks. Too subtle, fade would mask it entirely.
- `max-h-[14.5rem]` (232px) ÷ 37 ≈ 6.27 rows → **~10px of the 7th row visible** under the existing 24px `from-popover` fade. Clean half-row cutoff with the gradient layered over it.

### Peek/fade behavior

- Existing `showBottomFade` state and `bg-gradient-to-t from-popover to-transparent h-6` overlay are unchanged. They already render only when content actually overflows.
- With the new mid-row cutoff, the fade sits over a visibly-clipped row instead of a clean row edge — strengthening the "more below" signal.

## Out of scope

- No changes to fonts, icons, separators, popover width, search input, or empty-state branches.
- No other components touched.

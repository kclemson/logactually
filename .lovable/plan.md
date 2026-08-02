# Quick Add refinements

Four fixes: tighter chips, the missing exercise row (real bug found), a visible pinned state, and the Settings placement/copy.

## 1. Compact chips

- Drop the trailing calorie / exercise-count meta from the chip entirely. The `meta` prop stays on `QuickAddRow` for future callers, but Food and Exercise stop passing it.
- Shorten long names on word boundaries instead of mid-word CSS truncation: a small helper trims to a character budget (~18 chars) at the last space and appends an ellipsis, so chips never cut a word in half. Names that already fit are untouched.
- Full name always available: `title` attribute on every chip (native tooltip), and on hover-capable devices the chip expands to its full name on hover/focus (existing `useHasHover` hook decides). Touch devices keep the shortened label only.
- Tighter padding so more chips fit per row.

## 2. Exercise Quick Add never appears (bug)

Confirmed by querying the data: `useQuickAddRoutines` filters with `.neq('raw_input', 'apple-health-import')`. In Postgres a `<>` comparison against `NULL` is `NULL`, so **every row with a null `raw_input` is dropped** — and manually logged sets from saved routines have `raw_input = NULL`. On this account that filter removes all 91 saved-routine rows in the last 30 days (three "Dog walk" routines used on 19, 17 and 11 days), leaving nothing to qualify.

Fix: keep the Apple Health exclusion but make it null-safe — `.or('raw_input.is.null,raw_input.neq.apple-health-import')`. No threshold changes needed; those routines clear the bar comfortably once the rows are visible.

## 3. Pinned chips look pinned

Pinned chips get a distinct treatment: a small filled `Pin` icon before the name plus a stronger, filled accent background, so "Always show" produces immediate visible feedback in the row. Menu label logic stays as-is.

## 4. Settings

Move the Quick Add toggle in `PreferencesSection` to sit directly below Theme and above Daily calorie target, and change the description to "One-tap chips for saved meals and routines you log very frequently". The "Restore N hidden" link moves with it.

## Technical notes

- `src/components/QuickAddRow.tsx` — word-boundary shortening helper, hover expansion, pinned styling, no meta rendering by default.
- `src/hooks/useQuickAddRoutines.ts` — null-safe Apple Health exclusion.
- `src/pages/FoodLog.tsx`, `src/pages/WeightLog.tsx` — stop passing `meta`.
- `src/components/settings/PreferencesSection.tsx` — reorder + copy.
- Selection logic in `src/lib/quick-add.ts` and its tests are unchanged; a unit test is added for the name-shortening helper.

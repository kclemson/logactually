# Quick Add: one-tap row for your most-repeated saved items

A row of one-tap chips sits directly under the date row on the Food log (and Weight log), letting you add the saved meals/routines you log almost every day without opening the Saved menu.

## The concept and name

Use **Quick Add**, with a **pin** for manual control (pin = "always show here", the same mental model already used for pinned bloodwork charts). "Saved" (star) stays as-is for the full list, so the two ideas don't collide.

## Where it appears

Under the date navigation row, above the day's entries — so it reads as "not yet in today's list". Chips are laid out inline and all visible at once (wrapping to at most two rows), never a dropdown.

Each chip:
- Leading `+` icon, saved item name, and a small trailing figure (calories for meals, exercise count for routines).
- Tapping it logs the item to the currently selected day immediately (same path as picking it from the Saved menu, so `source_meal_id` / `source_routine_id` and use counts stay correct).
- Once logged for that day, the chip briefly flips to a check and then leaves the row — the row only ever shows things not yet logged that day. If everything's logged, the row disappears.
- Food chips use the blue accent, exercise chips purple.

A trailing `⋯` chip opens a small popover to unpin/hide an individual item or turn Quick Add off entirely.

## Threshold (which items qualify)

Computed from actual logged days in a rolling **30-day window**, not the all-time `use_count`:

- `activeDays` = distinct days in the window where you logged anything in that domain (food days for meals, exercise days for routines).
- `usedDays` = distinct days in the window where that saved item was logged.
- The row only appears at all when `activeDays >= 5` (new accounts see nothing until there's a real pattern).
- An item qualifies when `usedDays >= max(3, 0.3 * activeDays)` — i.e. roughly a third of your active days, with a floor of 3 days so it can't trigger on a single busy week.
- Ranked by `usedDays` (tie-break: most recently used), capped at **4** chips so they always fit on screen.
- Manually pinned items always show and sort first; manually hidden items never show. Pins are exempt from the cap only up to a total of 6 chips.

These numbers live in one constants block so they're easy to tune after you use it.

## Settings

New "Quick Add" control in Settings, defaulting **on** for everyone, plus per-item pin/hide managed from the row's `⋯` popover. Off = row never renders in either domain.

## Technical notes

- `src/lib/quick-add.ts` — pure, domain-agnostic: takes `{ usageByItemId, activeDays, pinned, hidden, limit }` and returns ranked candidate ids. Unit-tested for the threshold edges (below floor, exactly at 30%, pin/hide overrides, cap).
- `src/hooks/useQuickAddUsage.ts` — generic usage query: given a table, date column, source-id column and window, returns `{ activeDays, usedDays per id }`. Food reads `food_entries.source_meal_id` / `eaten_date`; exercise reads `weight_sets.source_routine_id` / `logged_date`. Thin wrappers `useFoodQuickAdd` / `useRoutineQuickAdd` join with `useSavedMeals` / `useSavedRoutines`. Custom logs can plug in later with a third wrapper — no changes to the lib or the UI component.
- `src/components/QuickAddRow.tsx` — presentational only: `items`, `accent`, `onAdd`, `onPin`, `onHide`, `onDisable`.
- `src/hooks/useUserSettings.ts` — add `quickAddEnabled: boolean` (default `true`), `quickAddPinned: string[]`, `quickAddHidden: string[]` (saved-item UUIDs, so one pair of arrays covers all domains).
- Wire into `src/pages/FoodLog.tsx` and `src/pages/WeightLog.tsx` reusing their existing `handleLogSavedMeal` / saved-routine handlers; respect read-only mode (row hidden for demo/read-only users).
- Settings toggle added to the existing Preferences section.

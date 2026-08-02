# Quick Add: one-tap row for your most-repeated saved items

A row of one-tap chips sits directly under the date row on the Food log (and Weight log), letting you add the saved meals/routines you log almost every day without opening the Saved menu.

## Review outcome

I re-checked the plan against the actual code before committing to it. Three changes from the first draft, all to reduce risk:

1. **No generic "any table" data hook.** The typed database client makes dynamic table names awkward and that abstraction would be built for a third case that doesn't exist yet. Instead: one tiny per-domain query hook, both feeding a single shared pure function and a single shared UI component. Custom logs later add one more small hook — the shared parts don't change.
2. **Don't piggyback on the existing "suggest saves" queries.** Those fetch 90 days by logged-at time and can silently hit the 1000-row cap for heavy users, and they're tuned for a different job. Quick Add gets its own 30-day, two-column query — cheap and independent, so nothing about the well-tested save-suggestion flow changes.
3. **Demo/read-only users are not special-cased.** Chips reuse the exact handler the Saved menu already calls, which already routes demo users into the demo preview dialog. Nothing new to keep in sync.

## The concept and name

**Quick Add**, with a **pin** for manual control (pin = "always show here" — the same mental model as pinned bloodwork charts). "Saved" (star) still means the full list, so the two ideas stay distinct.

## Where it appears

Under the date navigation row, above the day's entries — so it reads as "not in today's list yet". Chips lay out inline, all visible at once (wrapping, max two rows), never a dropdown.

Each chip:
- Leading `+`, the saved item's name, and a small trailing figure (calories for meals, exercise count for routines).
- Tapping logs it to the **currently selected day** (not just today), because it goes through the same code path as picking it from the Saved menu — so `source_meal_id` / `source_routine_id`, group naming, and use counts all behave identically to today.
- Anything already logged on the viewed day is filtered out of the row, which is what makes "not added yet" unambiguous. Tap → the chip animates out as the entry appears. All logged → the row is gone.
- Food chips blue, exercise chips purple.

A trailing `⋯` chip opens a small popover: unpin/hide a single item, or turn Quick Add off.

## Threshold (which items qualify)

From real logged days in a rolling **30-day window**, not the all-time use count:

- `activeDays` = distinct days in the window with any logging in that domain.
- `usedDays` = distinct days in the window that included that saved item.
- The row only appears when `activeDays >= 5`, so new accounts see nothing until there's a real pattern.
- An item qualifies at `usedDays >= max(3, 0.3 * activeDays)` — about a third of your active days, floored at 3 days so one busy week can't trigger it.
- Ranked by `usedDays`, tie-broken by most recent use, capped at **4** chips.
- Pinned items always show and sort first (hard cap 6 total); hidden items never show.

All of these live in one constants block, easy to tune once you've lived with it.

## Settings

A "Quick Add" toggle in Settings, default **on** for everyone. Off = the row never renders in either domain. Per-item pin/hide is managed inline from the row's `⋯` popover.

## Technical notes

- `src/lib/quick-add.ts` — pure and domain-agnostic: `{ usage: Map<id, {usedDays, lastUsedAt}>, activeDays, pinned, hidden, alreadyLoggedIds }` in, ranked ids out. Unit tested at the edges: below the activity floor, exactly at 30%, the 3-day floor, pin/hide overrides, cap behavior, already-logged filtering.
- `src/hooks/useQuickAddFood.ts` / `useQuickAddRoutines.ts` — each runs one 30-day query (`food_entries: eaten_date, source_meal_id` / `weight_sets: logged_date, source_routine_id`), builds the usage map, and joins names/macros from the existing `useSavedMeals` / `useSavedRoutines` caches. Small payloads, well under the row cap; 5-minute `staleTime`; invalidated by the same keys the log pages already invalidate on create/delete.
- `src/components/QuickAddRow.tsx` — presentational only: `items`, `accent`, `onAdd`, `onPin`, `onHide`, `onDisable`. No data or domain logic, so a future custom-log version reuses it as-is.
- `src/hooks/useUserSettings.ts` — add `quickAddEnabled: boolean` (default `true`), `quickAddPinned: string[]`, `quickAddHidden: string[]`. Saved-item ids are UUIDs, so one pair of arrays safely covers all domains. Additive to the settings blob, consistent with how `hiddenCharts` already works.
- `src/pages/FoodLog.tsx` / `src/pages/WeightLog.tsx` — render the row between `DateNavigation` and the entries table, calling the existing `handleLogSavedMeal` / `handleLogSavedRoutine` handlers after the existing `useLogSavedMeal` / `useLogSavedRoutine` mutation, exactly as the Saved popover does today. Already-logged detection uses the day's entries the pages already hold.
- Settings toggle goes in the existing Preferences section.

### Regression surface

Additive throughout: no changes to entry creation, save-suggestion detection, saved-meal/routine mutations, or the Saved popover. The only shared file touched behaviorally is `useUserSettings`, where three new defaulted keys merge in the same way existing keys do.

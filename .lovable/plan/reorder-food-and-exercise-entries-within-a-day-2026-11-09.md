# Reorder food and exercise entries within a day

## Recommendation
Add small up and down arrows to the panel that opens when you tap the arrow next to an entry. That panel already holds "Save as meal", "Copy to today" and "Details", so the arrows sit alongside those and the main list stays as clean as it is now.

```text
Logged as: turkey sandwich
Save as meal                 [↑] [↓]   Copy to today   Details
```

- Each tap moves the whole entry (a single food or a whole group) up or down by one spot. The panel stays open, so you can tap ↑ three times to move a forgotten snack up past dinner.
- The ↑ arrow is hidden on the top entry and ↓ on the bottom one.
- The new order is saved, so it sticks on every device. New entries still appear at the bottom.
- Moving only reorders the day. Totals, dates and everything else stay the same.

**Why not drag and drop?** On a phone it clashes with scrolling and swiping between days, and it needs a visible handle on every row, which is the clutter you want to avoid. Arrows are clunkier when you move something a long way, but a day rarely has more than about 10 entries.

## Exercise works the same way
The Exercise tab gets the same ↑ / ↓ arrows in the same panel. They move one whole entry at a time: a single exercise, or a group like "Leg day" with all its sets.

## Technical notes
- **Database:** add a nullable `sort_order integer` column to `food_entries` and `weight_sets`, in one migration. This is additive, so nothing existing breaks. For exercise, every row in an entry (same `entry_id`) gets the same `sort_order`, so groups move together.
- **Day list queries** (`useFoodEntries` and `useWeightEntries`, the per-day lists only): order by `sort_order` (nulls last), then by `created_at` and `id`. Days nobody has touched look exactly as they do now, and new entries (`sort_order` null) land at the bottom.
- **On move:** take the day's entries in their current order, swap the two neighbors, and write `sort_order = 0..n` for that day's entries in one batch. Update the cached list first so the move feels instant.
- **Why not swap the "logged at" times instead?** It would avoid a database change, but those times mean "when it was logged" and other features rely on them: recent-food suggestions, and the order of other entries in the save-meal dialog.
- **Panel:** `EntryExpandedPanel` gets optional `onMoveUp` / `onMoveDown` props, with ghost icon buttons (`ArrowUp` / `ArrowDown`). Each icon is small (about 16px), but each button is a 36×36px tap area with a gap between the two, so they're easy to hit on a phone. They get `aria-label`s ("Move up" / "Move down"). `FoodItemsTable` and `WeightItemsTable` pass them on their own pages. They're disabled in demo/read-only mode.
- **Verified safe:** editing an entry updates its rows in place without re-creating them, so an edited entry keeps its position. If a set is ever added to an existing exercise entry, it copies that entry's `sort_order` so it doesn't drift to the bottom.
- **Test:** a small test for the reorder helper, checking that moving the 3rd entry up swaps it with the 2nd and keeps the rest in order.

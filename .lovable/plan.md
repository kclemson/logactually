

## Plan: Match individual food items instead of whole multi-item entries

The current approach groups all items from a multi-item entry into one typeahead candidate, producing overwhelming labels like "Black Coffee, Whole Milk, Ground Cinnamon, Zero Sugar...". Instead, we should explode multi-item entries into individual item-level candidates.

### Change

In `src/pages/FoodLog.tsx`, update the candidate-building logic to:

1. **Iterate over individual `food_items`** rather than whole entries
2. **Deduplicate by individual item description** (normalized/lowercased) instead of by items signature
3. **Each candidate represents a single food item** — label is just the item description, subtitle is its calories, payload is a single-item array `[item]`
4. **Keep multi-item entries with a `group_name` as grouped candidates** — these represent intentional groups (saved meals, photo logs) and should stay as one candidate

### Logic sketch

```typescript
for (const entry of recentEntries) {
  if (entry.source_meal_id) continue;

  // Entries WITH a group_name → keep as single grouped candidate
  if (entry.group_name && entry.food_items.length > 1) {
    // dedup by group_name, candidate label = group_name
    // payload = all items
  } else {
    // Explode into individual items
    for (const item of entry.food_items) {
      // dedup by normalized description
      // candidate label = item.description
      // payload = [item] (single-item array)
    }
  }
}
```

This way:
- Typing "coffee" shows "Black Coffee" as a clean single-item match
- Intentional groups (with `group_name`) still appear as grouped entries
- Legacy pre-grouping entries get exploded into individual items, avoiding the long comma-separated labels
- Selecting a match logs just that single item (or the full group if it was a named group)

### Files changed

- `src/pages/FoodLog.tsx` — rewrite the `typeaheadCandidates` useMemo block (~lines 122–172)


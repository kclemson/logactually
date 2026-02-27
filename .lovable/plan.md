

## Plan: Show AI-extracted item names in typeahead instead of raw input

The issue is in `src/pages/FoodLog.tsx` lines 144-146. For multi-item entries, the `label` currently falls back to `entry.raw_input` (the user's original text). Instead, it should show the AI-extracted item descriptions.

### Change

In `src/pages/FoodLog.tsx`, update the label logic for multi-item entries:

**Current** (line 144-146):
```typescript
const label = entry.food_items.length === 1
  ? entry.food_items[0].description
  : (entry.group_name || entry.raw_input || entry.food_items[0].description);
```

**New**:
```typescript
const label = entry.food_items.length === 1
  ? entry.food_items[0].description
  : (entry.group_name || entry.food_items.map(i => i.description).join(', '));
```

This way:
- Single item → shows the extracted description (already correct)
- Multi-item with a group name → shows the group name (e.g., "Breakfast")
- Multi-item without group name → shows comma-separated item descriptions (e.g., "Bacon, Coffee with milk") instead of the raw input text

One file changed, one line modified.


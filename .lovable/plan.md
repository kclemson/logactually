

# Stop clearing portion when description is edited inline

## Problem
When a user edits a food item's description inline, the portion field is automatically cleared (line 752 of `FoodItemsTable.tsx`). This was a safeguard against stale portion data, but now that the Detail Dialog provides a full editor for all fields (including portion), it's no longer necessary -- users can fix portions there if needed.

## Change

### `src/components/FoodItemsTable.tsx`

Remove the line that clears the portion on description save:

```tsx
// Before (line 750-752):
onSave={(desc) => {
  onUpdateItem?.(index, 'description', desc);
  if (item.portion) onUpdateItem?.(index, 'portion', '');
}}

// After:
onSave={(desc) => {
  onUpdateItem?.(index, 'description', desc);
}}
```

That's it -- one line removed.

## Files changed

| File | What |
|------|------|
| `src/components/FoodItemsTable.tsx` | Remove portion-clearing side effect from inline description edit |


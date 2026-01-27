

## Fix Duplicate Key Bug in FoodItemsTable

### Problem Summary

The console warning "Encountered two children with the same key" occurs because the same UID appears in multiple entries stored in the database. This happens due to a race condition when:

1. User logs a saved meal → new entry is created with fresh UIDs
2. Before the query cache updates, user deletes an item from a DIFFERENT entry
3. The deletion logic uses stale boundary indices to slice items from `displayItems`
4. Items from the NEW entry get incorrectly saved to the OLD entry
5. Both entries end up with the same UID, causing React key conflicts

### Root Cause Analysis

The bug is in how `getItemsForEntry()` works:

```typescript
const getItemsForEntry = useCallback((entryId: string): FoodItem[] => {
  const boundary = entryBoundaries.find(b => b.entryId === entryId);
  if (!boundary) return [];
  return displayItems.slice(boundary.startIndex, boundary.endIndex + 1);
}, [entryBoundaries, displayItems]);
```

The problem:
- `entryBoundaries` is computed from `entries` (the raw query data)
- `displayItems` includes both query items AND locally-added `newItems`
- When new items are added via `addNewItems()`, `displayItems` grows but `entryBoundaries` uses old indices
- Slicing `displayItems` with stale boundaries returns wrong items

### Solution

Instead of relying on index-based slicing (which is fragile when arrays change), filter items by their `entryId` property:

```typescript
const getItemsForEntry = useCallback((entryId: string): FoodItem[] => {
  return displayItems.filter(item => item.entryId === entryId);
}, [displayItems]);
```

This is more robust because:
- Each item knows which entry it belongs to (via `entryId`)
- No dependency on array indices or boundary calculations
- Works correctly even when `displayItems` has pending new items

### Additional Cleanup

Also fix the saved meals to not store stale `entryId` values. When saving a meal via "Save as meal", strip out `entryId` and `uid` from items before saving to `saved_meals`:

**In `useSaveMeal` mutation:**
```typescript
const cleanedItems = foodItems.map(({ uid, entryId, ...rest }) => rest);
```

This prevents the saved meal from polluting future entries with stale metadata.

### Data Fix

The current database has entries with duplicate UIDs that need cleanup. After the code fix, the user should delete the duplicate entries or edit them to have unique UIDs. I can provide a SQL query to identify and clean up these entries if needed.

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Change `getItemsForEntry` to filter by `entryId` instead of slicing by index |
| `src/hooks/useSavedMeals.ts` | In `useSaveMeal`, strip `uid` and `entryId` from items before saving |

### Technical Note

The `entryBoundaries` array is still needed for:
- Determining which item is the "last" in an entry (for showing the chevron)
- Visual grouping/dividers in the table

But it should NOT be used for data operations like getting items to save - that should use the `entryId` property on each item.



## Fix: Eliminate Flash of Individual Outlines

### The Problem

When adding a saved meal with multiple items, there's a brief flash of individual outlines around each row before the unified grouped outline appears.

### Root Cause

The timing sequence creates a race condition:

1. `createEntry.mutate()` succeeds and React Query cache updates
2. Component re-renders with new `allItems` and `entryBoundaries` 
3. At this point, `newEntryIds` is still empty (set in `onSuccess` hasn't run yet)
4. Without `newEntryIds`, no highlight animation is applied
5. Then `onSuccess` callback fires, calling `addNewItems()` which sets `newEntryIds`
6. Another re-render occurs, now with the grouped outline

The flash occurs in step 3-4 because there's a render where:
- The rows exist (from query data)
- But `newEntryIds` hasn't been populated yet

Additionally, `newItemUids` still triggers the `animate-highlight-fade` animation on description cells, which may contribute to the visual inconsistency.

### Solution

Set `newEntryIds` optimistically BEFORE the mutation succeeds, using the entry ID that will be created. Since we're generating UIDs upfront anyway, we can also generate the entry ID upfront and pass it to the mutation.

However, looking at the current flow, the `entryId` comes from `createdEntry.id` which is the database-generated UUID. We can't know this ahead of time unless we generate it client-side.

**Alternative approach**: Generate the entry ID client-side before the mutation:

```typescript
const entryId = crypto.randomUUID();
// Use this for both the mutation and addNewItems
```

This requires the database to accept client-provided IDs (which it should, since `id` has a default).

### Files to Modify

#### 1. `src/pages/FoodLog.tsx`

In `createEntryFromItems`:

```typescript
const createEntryFromItems = useCallback((items, rawInput, sourceMealId) => {
  // Generate entry ID upfront (client-side)
  const entryId = crypto.randomUUID();
  
  const itemsWithUids = items.map(item => ({
    ...item,
    uid: crypto.randomUUID(),
    entryId, // Add entryId immediately
  }));
  
  // Set highlights BEFORE mutation
  addNewItems(itemsWithUids);
  
  createEntry.mutate({
    id: entryId, // Pass client-generated ID
    // ... rest of mutation data
  }, {
    onSuccess: () => {
      foodInputRef.current?.clear();
    },
    onError: () => {
      // Remove items on error (they weren't saved)
      // Could add rollback logic here
    }
  });
}, [...]);
```

This ensures `newEntryIds` is populated BEFORE query data updates, eliminating the flash.

#### 2. Verify database accepts client-provided ID

The `food_entries` table likely has `id uuid default gen_random_uuid()`, which means passing an explicit ID should work. If not, we may need to verify this.

#### 3. Remove redundant `newItemUids` highlight (optional)

Since we're now using entry-based grouping, the individual `animate-highlight-fade` on description cells (line 313 in FoodItemsTable) could be cleaned up. However, this may be desired for the amber background effect, so we should keep it but ensure it doesn't conflict with the outline animation.

### Implementation Order

1. Update `createEntryFromItems` in `FoodLog.tsx` to:
   - Generate `entryId` client-side
   - Add `entryId` to items before calling `addNewItems`
   - Call `addNewItems` BEFORE the mutation
   - Pass the client-generated `id` to the mutation

2. Same pattern for `handleScanResult` (single item case)

3. Verify mutations work with client-provided IDs

### Edge Case: Error Handling

If the mutation fails after we've already added items to local state, we need to clean them up. Add error handling:

```typescript
onError: () => {
  // Items were added optimistically but save failed
  // Clear them from local state
  setNewItems(prev => prev.filter(i => i.entryId !== entryId));
  setNewEntryIds(prev => {
    const next = new Set(prev);
    next.delete(entryId);
    return next;
  });
}
```

This requires exposing a `removeNewItems` function from the hook, or calling existing `removeItem` for each.

### Visual Result

Before: Flash of unstyled rows → then grouped outline appears
After: Grouped outline appears immediately (no flash)

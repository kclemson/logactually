
## Fix: Invalidate Recent Entries Cache After Creating Entries

### Problem

The `recent-food-entries` query has a 5-minute `staleTime`. When you add entries across different days (especially when backdating), the cache remains "fresh" and doesn't include the entries you just created. The detection logic operates on a stale snapshot that's missing your recent additions.

This explains why "costco hot dog" wasn't being detected - each new entry was being compared against a cache that didn't include the previous entries you'd just added.

### Solution

After creating any food entry, invalidate the `recent-food-entries` cache so the next detection check sees all recent entries including the one we just created.

### Implementation

**File**: `src/pages/FoodLog.tsx`

**Change 1**: Invalidate cache after entry creation in `createEntryFromItems`

```typescript
// After line 249 (after invalidating the per-day cache):
await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });

// ADD THIS:
// Invalidate recent entries cache so next detection sees this entry
queryClient.invalidateQueries({ queryKey: ['recent-food-entries'] });
```

**Change 2**: Invalidate cache after barcode scan in `handleScanResult`

```typescript
// After line 442 (after invalidating the per-day cache):
await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });

// ADD THIS:
queryClient.invalidateQueries({ queryKey: ['recent-food-entries'] });
```

**File**: `src/pages/WeightLog.tsx`

**Change 3**: Apply same pattern for weight entries

After creating weight entries, invalidate `recent-weight-entries` so the next detection check includes the new entry.

### Why This Works

| Before | After |
|--------|-------|
| Entry 1 created, cache still shows old data | Entry 1 created, cache invalidated |
| Entry 2 detection uses stale cache (missing Entry 1) | Entry 2 detection refetches and sees Entry 1 |
| Entry 3 detection uses stale cache (missing Entry 1 & 2) | Entry 3 detection refetches and sees Entry 1 & 2 |

### Technical Detail

- We use `queryClient.invalidateQueries()` without `await` for the recent entries cache
- This triggers a background refetch without blocking the UI
- The per-day cache (`food-entries`, `dateStr`) is still awaited since we need it for immediate display

### Files to Change

| File | Changes |
|------|---------|
| `src/pages/FoodLog.tsx` | Add cache invalidation in `createEntryFromItems` and `handleScanResult` |
| `src/pages/WeightLog.tsx` | Add cache invalidation in `createEntryFromExercises` |

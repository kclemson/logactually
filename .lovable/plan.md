

## Fix: Use Fresh Cache Data for Detection (Closure Problem)

### Root Cause

The detection uses `recentEntries` from the `useCallback` closure. Even after invalidating and refetching the cache, the callback still references the OLD value that was captured when the callback was created.

The flow today:
1. Entry 1 created on Nov 13
2. `invalidateQueries(['recent-food-entries'])` triggers background refetch
3. `detectRepeatedFoodEntry(items, recentEntries)` runs with the OLD `recentEntries` (missing Entry 1)
4. Navigate to Nov 12, component remounts, callback recreated with updated `recentEntries`
5. Entry 2 created
6. Detection runs with closure `recentEntries` that now includes Entry 1, but NOT Entry 2 (same closure problem)

### Solution

Instead of relying on the closure variable, read the cache directly from `queryClient` at detection time. This ensures we always have the freshest data.

### Implementation

**File**: `src/pages/FoodLog.tsx`

**Change 1**: Get fresh cache data at detection time

```typescript
// In createEntryFromItems, replace lines 258-263:

// Before:
if (!isReadOnly && settings.suggestMealSaves && recentEntries && !sourceMealId && !skipSaveSuggestion) {
  const suggestion = detectRepeatedFoodEntry(items, recentEntries);
  // ...
}

// After:
if (!isReadOnly && settings.suggestMealSaves && !sourceMealId && !skipSaveSuggestion) {
  // Get fresh cache data (includes entries added before this one)
  const freshRecentEntries = queryClient.getQueryData<FoodEntry[]>(
    ['recent-food-entries', user?.id, 500]
  ) ?? [];
  
  // Exclude the entry we just created (don't match against itself)
  const historyEntries = freshRecentEntries.filter(e => e.id !== entryId);
  
  const suggestion = detectRepeatedFoodEntry(items, historyEntries);
  if (suggestion && !isDismissed(suggestion.signatureHash)) {
    setSaveSuggestion(suggestion);
    setSaveSuggestionItems([...suggestion.items]);
  }
}
```

**Change 2**: Add `useAuth` import and get user

The query key includes `user?.id`, so we need access to it:

```typescript
// Add to imports if not present
import { useAuth } from '@/hooks/useAuth';

// In component, get user
const { user } = useAuth();
```

**Change 3**: Add FoodEntry to imports

```typescript
import { FoodItem, SavedMeal, calculateTotals, FoodEntry } from '@/types/food';
```

**Change 4**: Update useCallback dependencies

Remove `recentEntries` from the dependency array (we no longer use it for detection), add `user?.id`:

```typescript
}, [createEntry, dateStr, queryClient, markEntryAsNew, isReadOnly, settings.suggestMealSaves, user?.id]);
```

### Why This Works

| Before | After |
|--------|-------|
| Uses `recentEntries` from closure (stale) | Uses `queryClient.getQueryData()` (live cache) |
| Detection misses recently created entries | Detection sees all cached entries |
| Depends on React re-render timing | Reads cache synchronously at execution time |

### Files to Change

| File | Changes |
|------|---------|
| `src/pages/FoodLog.tsx` | Use `queryClient.getQueryData` for detection, add user import, update dependencies |

### Technical Notes

- `queryClient.getQueryData()` is synchronous and returns the current cache value
- We filter out the current entry (`e.id !== entryId`) to prevent self-matching
- The background invalidation we added is still useful: it ensures the cache gets updated for future operations
- We keep `recentEntries` for the history reference detection in `handleSubmit` (that runs BEFORE creating an entry, so staleness isn't an issue there)



## Change: Use Most Recent Entries by Creation Date, Not Eaten Date

### Current Behavior

The `useRecentFoodEntries` hook queries entries where:
```typescript
.gte('eaten_date', cutoffDate)  // eaten_date >= 90 days ago
```

This means it looks at **entries with `eaten_date` within the last 90 days**, regardless of when they were actually created.

### Problem

When backdating entries (e.g., adding food for December while it's February), the comparison pool is based on `eaten_date`. This doesn't capture the user's actual logging patterns - what matters is what they've **recently added**, not what dates those entries are for.

Example:
- User logs "Costco hot dog" multiple times in January 2026
- User backdates an entry to December 2025  
- Detection should still recognize the pattern from January logs

### Solution

Change the query from filtering by `eaten_date` to:
1. Order by `created_at` descending
2. Limit to the most recent N entries (not days)

This better captures "what has the user been logging recently" rather than "what dates fall within a window."

### Implementation

**File**: `src/hooks/useRecentFoodEntries.ts`

```typescript
// Before:
export function useRecentFoodEntries(daysBack = 90) {
  // ...
  const cutoffDate = format(subDays(new Date(), daysBack), 'yyyy-MM-dd');
  
  const { data, error } = await supabase
    .from('food_entries')
    .select('...')
    .gte('eaten_date', cutoffDate)
    .order('eaten_date', { ascending: false })
    .order('created_at', { ascending: false });

// After:
export function useRecentFoodEntries(limit = 500) {
  // ...
  // No date cutoff - just get the most recently CREATED entries
  const { data, error } = await supabase
    .from('food_entries')
    .select('...')
    .order('created_at', { ascending: false })
    .limit(limit);
```

**File**: `src/pages/FoodLog.tsx`

Update the hook call:
```typescript
// Before:
const { data: recentEntries } = useRecentFoodEntries(90);

// After:
const { data: recentEntries } = useRecentFoodEntries(500);
```

### Data Size Analysis

Original comment in the hook:
> Average food_items size per entry: ~474 bytes
> Worst case (10 entries/day x 90 days): ~550 KB

With 500 entries:
- 500 entries × 500 bytes ≈ 250 KB
- This is actually smaller than the 90-day worst case
- Well within acceptable limits for a cached query

### Query Key Update

The query key should reflect the new parameter:
```typescript
// Before:
queryKey: ['recent-food-entries', user?.id, daysBack]

// After:
queryKey: ['recent-food-entries', user?.id, limit]
```

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useRecentFoodEntries.ts` | Replace date-based filter with `created_at` ordering + limit |
| `src/pages/FoodLog.tsx` | Update hook call parameter from `90` to `500` |

### Behavior Comparison

| Scenario | Before | After |
|----------|--------|-------|
| Backdate entry to December | Only matches entries with Dec-Feb eaten_dates | Matches any of the 500 most recently created entries |
| Forward-date entry to next month | Would miss it entirely | Included if recently created |
| User with sparse logging | Gets very few entries | Gets up to 500 most recent regardless of date spread |
| User with dense logging (10/day) | ~900 entries (90 days) | Capped at 500 entries |

### Parallel Change for Weight Entries

The same logic should apply to `useRecentWeightEntries.ts` for consistency:

| File | Change |
|------|--------|
| `src/hooks/useRecentWeightEntries.ts` | Replace date-based filter with `created_at` ordering + limit |
| `src/pages/WeightLog.tsx` | Update hook call parameter |

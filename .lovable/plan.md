
## Plan: Fix Calendar Date Highlighting After Adding Entries

### Problem
After adding a food entry on January 1st and navigating away ("Go to Today") then back to January via the calendar picker, January 1st is not highlighted blue despite having data.

### Root Cause
When a new food entry is created, only the `food-entries` query is invalidated. The `food-dates` query (used for calendar highlighting) remains cached with stale data from the initial fetch.

**Current flow:**
1. Open calendar, navigate to January → `food-dates` for January is fetched and cached
2. Add food to Jan 1st → `food-entries` invalidated, but `food-dates` cache unchanged
3. Navigate away to today
4. Navigate back to January → React Query returns stale cached `food-dates` (missing Jan 1st)

### Solution
Invalidate the `food-dates` query for the affected month when food entries are created. Same fix needed for weights.

### Technical Details

**File 1: `src/pages/FoodLog.tsx`**

In `createEntryFromItems` (around line 242), add invalidation for `food-dates`:
```tsx
// Current
await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });

// After fix - also invalidate the month's date cache
await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
await queryClient.invalidateQueries({ 
  queryKey: ['food-dates', format(selectedDate, 'yyyy-MM')] 
});
```

In `handleScanResult` (around line 400), add same invalidation:
```tsx
await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
await queryClient.invalidateQueries({ 
  queryKey: ['food-dates', format(selectedDate, 'yyyy-MM')] 
});
```

**File 2: `src/pages/WeightLog.tsx`**

Same pattern - invalidate `weight-dates` when weight entries are created.

### Why This Fixes the Issue
- When you add an entry on Jan 1st, the `food-dates` cache for January (`'2026-01'`) gets invalidated
- Next time you navigate to January in the calendar, React Query fetches fresh data
- January 1st now appears in the results and gets highlighted

### Additional Consideration
Could also consider invalidating `food-dates` in the `useFoodEntries` hook's mutation directly, but that would require passing the date-month context. Doing it in the page component is cleaner since `selectedDate` is already available.

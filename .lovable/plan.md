

## Refactor: Replace useEffect Synchronization with Awaitable Pattern

### Current Pattern (The Problem)

Both `FoodLog.tsx` and `WeightLog.tsx` use a three-step synchronization pattern:

```tsx
// 1. Store the entry ID in state before mutation
const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);

// 2. Derive when entry appears in query cache
const pendingEntryVisible = pendingEntryId 
  ? entries.some(e => e.id === pendingEntryId)
  : false;

// 3. useEffect watches for visibility and triggers highlight
useEffect(() => {
  if (pendingEntryVisible && pendingEntryId) {
    markEntryAsNew(pendingEntryId);
    setPendingEntryId(null);
  }
}, [pendingEntryVisible, pendingEntryId, markEntryAsNew]);
```

**Why this exists:** The mutation's `onSuccess` fires when the database write completes, but React Query's cache may not be updated yet. The entry needs to be in the DOM before we can highlight it.

**Why it's fragile:** This is reactive state synchronization - exactly what the useEffect guidelines warn against. It's hard to reason about timing, and rapid submissions could cause race conditions.

### Proposed Pattern (The Solution)

Use explicit awaitable calls instead of reactive synchronization:

```tsx
const queryClient = useQueryClient();

const createEntryFromItems = useCallback(async (items: FoodItem[], rawInput: string | null) => {
  const entryId = crypto.randomUUID();
  
  // Step 1: Await the mutation
  await createEntry.mutateAsync({
    id: entryId,
    eaten_date: dateStr,
    raw_input: rawInput,
    food_items: items,
    // ... totals
  });
  
  // Step 2: Await cache invalidation (ensures refetch is complete)
  await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
  
  // Step 3: Highlight (entry is now guaranteed in DOM after render)
  markEntryAsNew(entryId);
  
  foodInputRef.current?.clear();
}, [createEntry, dateStr, queryClient, markEntryAsNew]);
```

**Key insight:** `queryClient.invalidateQueries()` returns a Promise that resolves after the refetch completes. By awaiting it, we guarantee the data is in the cache before calling `markEntryAsNew`.

### Changes Required

**1. FoodLog.tsx**

Remove:
- `pendingEntryId` state declaration (line 62)
- `pendingEntryVisible` derived value (lines 157-159)
- `useEffect` watching for visibility (lines 162-167)

Modify `createEntryFromItems` (lines 211-245):
```tsx
const createEntryFromItems = useCallback(async (
  items: FoodItem[], 
  rawInput: string | null, 
  sourceMealId?: string
) => {
  const entryId = crypto.randomUUID();
  const itemsWithUids = items.map(item => ({
    ...item,
    uid: crypto.randomUUID(),
    entryId,
  }));
  
  const totals = calculateTotals(itemsWithUids);
  
  try {
    await createEntry.mutateAsync({
      id: entryId,
      eaten_date: dateStr,
      raw_input: rawInput,
      food_items: itemsWithUids,
      total_calories: Math.round(totals.calories),
      total_protein: Math.round(totals.protein * 10) / 10,
      total_carbs: Math.round(totals.carbs * 10) / 10,
      total_fat: Math.round(totals.fat * 10) / 10,
      source_meal_id: sourceMealId ?? null,
    });
    
    // Wait for cache to update so entry is in DOM
    await queryClient.invalidateQueries({ queryKey: ['food-entries', dateStr] });
    
    markEntryAsNew(entryId);
    foodInputRef.current?.clear();
  } catch (error) {
    // Error already logged by mutation's onError
  }
}, [createEntry, dateStr, queryClient, markEntryAsNew]);
```

Update `handleScanResult` similarly (lines 306-338).

Update loading state (line 497):
```tsx
// Before: isLoading={... || (isFetching && !!pendingEntryId)}
// After:  isLoading={isAnalyzing || createEntry.isPending}
```

**2. WeightLog.tsx**

Same pattern - remove:
- `pendingEntryId` state (line 68)
- `pendingEntryVisible` derived value (lines 192-194)
- `useEffect` (lines 197-202)

Modify `createEntryFromExercises` (lines 218-248) to use `mutateAsync` + `invalidateQueries`.

**3. useFoodEntries.ts and useWeightEntries.ts**

Remove `onSuccess` invalidation from mutations - we'll handle it explicitly in the component:

```tsx
// Before
const createEntry = useMutation({
  mutationFn: async (...) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['food-entries'] });
  },
});

// After
const createEntry = useMutation({
  mutationFn: async (...) => { ... },
  // No onSuccess - caller handles invalidation
});
```

**Why move invalidation to caller?** The caller needs to await it. If the hook does it in `onSuccess`, the caller can't await it.

---

### Risk Evaluation

| Risk | Severity | Mitigation |
|------|----------|------------|
| `mutateAsync` throws on error | Low | Wrap in try/catch; mutation already logs errors |
| Forgetting to invalidate | Medium | Only 2-3 call sites per log; can add comment reminding to invalidate |
| Double invalidation if multiple callers | Low | We're moving it, not duplicating; only the awaiting caller invalidates |
| Loading state timing changes | Low | `createEntry.isPending` is sufficient; we don't need to track post-mutation fetch |
| Race condition during rapid submits | Eliminated | Each submit independently awaits its own completion |

**Overall Risk: Low** - This is a simplification that removes complexity rather than adding it.

### Test Cases

**Happy Path:**
1. **Single entry creation** - Log a food item, verify highlight appears on the new row
2. **Rapid submission** - Submit 3 entries quickly, verify all 3 get highlighted correctly (no skipped highlights)
3. **Saved meal logging** - Log from saved meals popover, verify highlight appears

**Error Cases:**
4. **Network failure** - Disconnect network mid-submit, verify no highlight occurs and error is shown
5. **Auth expiry** - Let session expire, submit, verify graceful error handling

**Edge Cases:**
6. **Date navigation during submit** - Start submit, navigate to different date before completion, verify no crash
7. **Barcode scan** - Scan a barcode, verify highlight works (uses `handleScanResult`)

**Weight Log Parallel:**
8. **Repeat tests 1-6** for WeightLog with exercises instead of food items

**Regression:**
9. **Edit/delete operations** - Verify editing and deleting items still works (unaffected by this change)
10. **Loading indicator** - Verify spinner shows during analysis AND mutation, disappears after completion

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| State variables | 3 (`pendingEntryId`, `pendingEntryVisible`, useEffect) | 0 |
| Control flow | Reactive (hard to trace) | Sequential (easy to trace) |
| Race condition risk | Present | Eliminated |
| Lines of code | ~15 lines of synchronization logic | ~5 lines of await calls |



## Fix: Replace Index-Based Entry Lookups with Direct entryId Access

### Problem Summary

During rapid add/delete cycles, the displayed data can become corrupted because `entryBoundaries` (computed via `useMemo` in the parent) can become stale relative to `items` (passed from parent) or `displayItems` (filtered locally). When lookups use index-based `entryBoundaries.find()`, they may return the wrong entry's data.

**Observed symptom**: After adding 3 "costco hotdog" entries, deleting them, then logging a saved "coffee" meal, expanding the coffee entry showed "costco hotdog" as its raw input.

### Root Cause Analysis

Both `FoodItemsTable` and `WeightItemsTable` have a function `getEntryIdForItem(index)` that searches `entryBoundaries` by index range:

```tsx
const getEntryIdForItem = (index: number): string | null => {
  if (!entryBoundaries) return null;
  const boundary = entryBoundaries.find(
    b => index >= b.startIndex && index <= b.endIndex
  );
  return boundary?.entryId || null;
};
```

**The flaw**: Each item already has `item.entryId` as a property. Using index-based boundary lookup instead of direct property access creates a fragile dependency on boundary indices staying in sync with the items array.

**Race condition scenario**:
1. User deletes items (pendingRemovals filters them from displayItems)
2. displayItems.length changes, but entryBoundaries still reflects pre-delete indices
3. getEntryIdForItem(index) returns wrong entryId
4. entryRawInputs.get(wrongEntryId) returns wrong raw_input

### Changes Required

**1. FoodItemsTable.tsx**

Remove index-based lookup and use item.entryId directly:

```tsx
// Before (line 392):
const currentEntryId = getEntryIdForItem(index);

// After:
const currentEntryId = item.entryId || null;
```

Also fix the "Save as meal" button's item collection (line 653-656):

```tsx
// Before:
const boundary = entryBoundaries?.find(b => b.entryId === currentEntryId);
if (boundary) {
  const entryItems = items.slice(boundary.startIndex, boundary.endIndex + 1);
  onSaveAsMeal(currentEntryId, currentRawInput ?? null, entryItems);
}

// After (matches WeightItemsTable pattern):
const entryItems = items.filter(i => i.entryId === currentEntryId);
onSaveAsMeal(currentEntryId!, currentRawInput ?? null, entryItems);
```

**2. WeightItemsTable.tsx**

Same change - replace getEntryIdForItem(index) with item.entryId:

```tsx
// Before (line 319):
const currentEntryId = getEntryIdForItem(index);

// After:
const currentEntryId = item.entryId || null;
```

**3. Keep entryBoundaries for visual grouping only**

The `isFirstItemInEntry(index)` and `isLastItemInEntry(index)` functions are still needed for:
- Rendering the chevron on the last item of each entry
- Applying segmented highlight animations (top/middle/bottom rounding)

These remain index-based because they're purely visual and operate on the current render snapshot. The key fix is ensuring **data lookups** (entryId, rawInput, items to save) use the item's own entryId property.

**4. Optional cleanup: Remove getEntryIdForItem function**

Since it's no longer called, remove the dead code:

```tsx
// DELETE these lines in both files:
const getEntryIdForItem = (index: number): string | null => {
  if (!entryBoundaries) return null;
  const boundary = entryBoundaries.find(
    b => index >= b.startIndex && index <= b.endIndex
  );
  return boundary?.entryId || null;
};
```

---

### Risk Evaluation

| Risk | Severity | Mitigation |
|------|----------|------------|
| item.entryId is undefined | Low | Type already allows optional; we coalesce to null. Entries created correctly always have entryId. |
| Breaking visual grouping | None | Visual functions (isFirstInEntry, isLastInEntry) remain unchanged |
| Regression in data lookups | Low | Direct property access is simpler and more reliable than index search |
| Save as meal gets wrong items | Fixed | Using filter() by entryId is already the pattern in WeightItemsTable |

**Overall Risk: Very Low** - This is strictly a simplification that removes indirection. We're replacing a computed lookup with a direct property read.

**Complexity: Low** - 4 lines changed per file, plus ~6 lines of dead code removal.

---

### Combined Test Cases

These tests cover both the previous refactor (awaitable pattern) and this fix (entryId lookup):

**Core Happy Path:**
1. **Single entry creation** - Log a food item, verify highlight appears on the new row
2. **Rapid submission** - Submit 3 entries quickly, verify all 3 get highlighted correctly (no skipped highlights)
3. **Saved meal logging** - Log from saved meals popover, verify highlight appears

**The Bug Reproduction (Critical):**
4. **Rapid add then delete then add** - Add 3 "costco hotdog" entries rapidly, delete all 3, then log a saved meal. Expand the entry and verify the correct raw_input/meal name displays (not "costco hotdog")
5. **Save as meal after deletions** - Same as above, but also click "Save as meal" and verify the correct items are included in the dialog

**Error Cases:**
6. **Network failure** - Disconnect network mid-submit, verify no highlight occurs and error is shown
7. **Auth expiry** - Let session expire, submit, verify graceful error handling

**Edge Cases:**
8. **Date navigation during submit** - Start submit, navigate to different date before completion, verify no crash
9. **Barcode scan** - Scan a barcode, verify highlight works

**Weight Log Parallel:**
10. **Repeat tests 1-5, 8-9** for WeightLog with exercises instead of food items

**Regression:**
11. **Edit/delete operations** - Verify editing and deleting items still works
12. **Loading indicator** - Verify spinner shows during analysis AND mutation, disappears after completion
13. **Entry grouping visual** - Verify multi-item entries still show connected highlight animation and chevron on last item

---

### Summary

| Aspect | Before | After |
|--------|--------|-------|
| Entry ID lookup | Index-based search through entryBoundaries | Direct item.entryId property access |
| "Save as meal" items | Index-based slice() | Filter by entryId |
| Race condition risk | Present during rapid mutations | Eliminated |
| Lines changed | ~10 lines total | Removal of ~6 lines dead code |

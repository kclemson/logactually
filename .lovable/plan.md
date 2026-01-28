

## Simplify Highlighting: Remove Optimistic UI + Fix Delete Flicker

### Overview

This plan removes the complex optimistic `newItems` array that causes timing bugs, replaces it with an extended button loading state for feedback, and fixes the delete icon color flicker.

---

### Part 1: Remove `newItems` Array

**Files to modify:**

#### `src/hooks/useEditableItems.ts`

Remove the optimistic item storage completely:

- Delete `newItems` state (line 35)
- Delete `newItemUids` state (line 38) 
- Delete `addNewItems` function (lines 94-115)
- Delete `removeNewItemsByEntry` function (lines 118-131)
- Delete `clearNewHighlights` function (lines 134-136)
- Simplify `displayItems` to only process query items (no merging with `newItems`)
- Keep `newEntryIds` state and add a simple `markEntryAsNew(entryId)` function that:
  - Adds the entryId to `newEntryIds`
  - Sets a 2.5s timeout to remove it (for animation duration)

**Updated return object:**
```typescript
return {
  displayItems,        // Just processed query items
  newEntryIds,         // Still needed for grouped highlighting
  markEntryAsNew,      // New: simple function to set highlight
  updateItem,
  updateItemBatch,
  removeItem,
  clearPendingForItem,
  clearAllPending,
};
```

---

### Part 2: Extend Loading State Until Rows Visible

**Files to modify:**

#### `src/hooks/useFoodEntries.ts`

Expose `isFetching` from the query:

```typescript
return {
  entries: query.data || [],
  isLoading: query.isLoading,
  isFetching: query.isFetching,  // Add this
  error: query.error,
  createEntry,
  updateEntry,
  deleteEntry,
  deleteAllByDate,
};
```

#### `src/pages/FoodLog.tsx`

1. Track the "pending" entry ID to know when rows have appeared:

```typescript
const [pendingEntryId, setPendingEntryId] = useState<string | null>(null);
```

2. Check if pending entry exists in current entries:

```typescript
const pendingEntryVisible = pendingEntryId 
  ? entries.some(e => e.id === pendingEntryId)
  : false;
```

3. Clear pending when entry becomes visible:

```typescript
useEffect(() => {
  if (pendingEntryVisible && pendingEntryId) {
    markEntryAsNew(pendingEntryId);  // Trigger highlight animation
    setPendingEntryId(null);
  }
}, [pendingEntryVisible, pendingEntryId, markEntryAsNew]);
```

4. Update `createEntryFromItems`:

```typescript
const createEntryFromItems = useCallback((items, rawInput, sourceMealId) => {
  const entryId = crypto.randomUUID();
  const itemsWithUids = items.map(item => ({
    ...item,
    uid: crypto.randomUUID(),
    entryId,
  }));
  
  // Track that we're waiting for this entry
  setPendingEntryId(entryId);
  
  createEntry.mutate({
    id: entryId,
    eaten_date: dateStr,
    raw_input: rawInput,
    food_items: itemsWithUids,
    // ... totals
    source_meal_id: sourceMealId ?? null,
  }, {
    onSuccess: () => {
      foodInputRef.current?.clear();
    },
    onError: () => {
      setPendingEntryId(null);  // Clear on failure
    },
  });
}, [createEntry, dateStr]);
```

5. Compute extended loading state:

```typescript
// Button shows "Adding..." while:
// - AI is analyzing, OR
// - Mutation is pending, OR  
// - Query is refetching AND we have a pending entry
const isAddingFood = isAnalyzing || createEntry.isPending || (isFetching && !!pendingEntryId);
```

6. Pass to `LogInput`:

```typescript
<LogInput
  isLoading={isAddingFood}
  // ... rest
/>
```

7. Remove `addNewItems` and `removeNewItemsByEntry` calls - no longer needed.

---

### Part 3: Fix Delete Icon Flicker

**Root cause:** The button has `-m-2.5` negative margin expanding its hit area, combined with `hover:text-destructive` and `md:opacity-0 md:group-hover:opacity-100`. At certain mouse positions near the edge, the browser rapidly toggles which element is "hovered."

**File to modify:** `src/components/FoodItemsTable.tsx`

**Fix approach:** Use padding instead of negative margin, and add `relative z-10` to ensure consistent hit detection.

**Line 506 (individual item delete):**
```typescript
// Before:
className="h-11 w-11 -m-2.5 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"

// After:
className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
```

**Line 278 (totals row delete) and Line 520 (entry delete):**
Apply the same fix - remove negative margin, use smaller explicit size.

---

### Part 4: Cleanup - Remove Unused Code

#### `src/components/FoodItemsTable.tsx`

- Remove `newItemUids` prop from interface (line 40)
- Remove `newItemUids` destructuring (line 62)
- Remove `isNewItem` function (lines 193-195)
- Remove `animate-highlight-fade` from description classes (line 313)
- Keep all the `newEntryIds` / entry-based grouping logic (this still works)

#### `tailwind.config.ts`

No changes needed - the outline-fade animations are still used.

---

### Sequence Diagram

```text
User clicks "Add Food"
        │
        ▼
┌─────────────────────────────┐
│ Button shows "Adding..."    │
│ setPendingEntryId(newId)    │
│ createEntry.mutate(...)     │
└─────────────────────────────┘
        │
        ▼
   Mutation completes
   Query invalidates
   Query refetches
        │
        ▼
┌─────────────────────────────┐
│ entries now includes new    │
│ pendingEntryVisible = true  │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ useEffect fires:            │
│ - markEntryAsNew(entryId)   │
│ - setPendingEntryId(null)   │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Button returns to normal    │
│ New rows render with        │
│ grouped outline animation   │
└─────────────────────────────┘
```

---

### Visual Result

| Before | After |
|--------|-------|
| Items flash with individual outlines, then switch to grouped | Rows appear directly with grouped outline |
| Delete icon flickers red/gray on hover | Smooth color transition |
| "Adding..." disappears before rows visible | "Adding..." stays until rows render |

---

### Technical Notes

- The `pendingEntryId` pattern is simpler than optimistic UI because we only track *one* piece of state (an ID), not a parallel data array
- Using React Query's `isFetching` is the standard way to know when a refetch is in progress
- The highlight animation still works via `newEntryIds` + `markEntryAsNew()`, just triggered at a different time (when entry appears in query vs. when mutation starts)
- No changes to database schema or mutations needed


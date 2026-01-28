
## Fix: Group New Item Highlights by Entry

### The Problem

When multiple food items are added together (e.g., from a saved meal with 2 items), each row gets its own individual blue outline animation. The expected behavior is for all rows added together to share a single unified outline around the group.

### Root Cause

Currently the system tracks individual item UIDs (`newItemUids`) and applies `animate-outline-fade` to each row independently at line 353 in `FoodItemsTable.tsx`:

```tsx
isNewItem(item) && "animate-outline-fade"
```

But items added together all share the same `entryId`, which should be used for grouping the highlight.

### Solution

Track new entry IDs alongside individual UIDs, then wrap consecutive rows of the same "new" entry in a container that receives the outline animation.

---

### Files to Modify

#### 1. `src/hooks/useEditableItems.ts`

Add tracking for new entry IDs:

- Add `newEntryIds` state (`Set<string>`)
- In `addNewItems`, extract unique `entryId` values from items and store them
- Add timeout cleanup matching the 2.5s animation duration
- Return `newEntryIds` from the hook
- Also update the backwards-compatible `useEditableFoodItems` to expose it

#### 2. `src/components/FoodItemsTable.tsx`

Accept and use the new prop:

- Add `newEntryIds?: Set<string>` to props interface
- Restructure rendering to detect when rows belong to a "new" entry
- Wrap consecutive rows of the same new entry in a single container div with `animate-outline-fade rounded-md`
- Individual rows inside lose the animation class
- Keep the existing per-row animation as fallback for items without entryId

Rendering approach:
```text
For each item:
  - Check if item.entryId is in newEntryIds
  - If yes and this is first item of that entry: open wrapper div
  - Render the row (without outline animation)
  - If yes and this is last item of that entry: close wrapper div
```

#### 3. `src/pages/FoodLog.tsx`

Pass the new prop:

- Destructure `newEntryIds` from `useEditableFoodItems` 
- Pass it to `FoodItemsTable`

---

### Visual Result

**Before:** Each row gets its own separate blue outline box
```text
+-------------------------+
| Vanilla Yogurt          |
+-------------------------+
+-------------------------+
| Sliced Strawberries     |
+-------------------------+
```

**After:** All rows from the same entry share one unified outline
```text
+-------------------------+
| Vanilla Yogurt          |
| Sliced Strawberries     |
+-------------------------+
```

---

### Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Single-item entries | Works as before (one row, one outline) |
| Multiple new entries at once | Each entry group gets its own outline |
| Items without entryId | Fall back to individual highlighting (defensive) |

---

### Technical Notes

- Animation duration remains 2.5s (unchanged)
- The `outline-fade` keyframe uses `box-shadow: inset 0 0 0 2px` which naturally wraps around the container
- Using a wrapper div is cleaner than trying to apply first/middle/last border styling to individual rows

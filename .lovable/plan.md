
## Fix Race Condition in History Reference Logging

### Problem

When logging comma-separated historical references like "leftover fried rice, leftover curry":

1. First item matches correctly → prompt appears → user clicks "Log Past Entry" ✓
2. Second item prompt appears automatically (delightful!) 
3. User clicks to log second item → **fails silently**

### Root Cause

In `handleUsePastEntry`, the async `createEntryFromItems` is not awaited:

```typescript
const handleUsePastEntry = useCallback(async () => {
  if (!pendingEntryMatch) return;
  
  createEntryFromItems(...);     // ← Missing await
  
  setPendingEntryMatch(null);    // Runs before save completes
  foodInputRef.current?.clear();
}, [...]);
```

The state clears before the first save finishes, causing timing issues when the second prompt triggers.

### Solution

Add `await` before `createEntryFromItems`:

```typescript
const handleUsePastEntry = useCallback(async () => {
  if (!pendingEntryMatch) return;
  
  await createEntryFromItems(
    pendingEntryMatch.match.entry.food_items, 
    pendingEntryMatch.originalInput
  );
  
  setPendingEntryMatch(null);
  foodInputRef.current?.clear();
}, [pendingEntryMatch, createEntryFromItems]);
```

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Add `await` before `createEntryFromItems` at line 345 |

### Result

- Each entry fully saves before state clears
- Sequential prompts for comma-separated items work correctly
- The "delightful" experience of seeing prompts one after another continues to work

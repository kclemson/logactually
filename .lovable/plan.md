

## Fix: Dismiss Similar Meal Prompt Should Log AI-Analyzed Items

### Problem

When the user types something like "1 activia vanilla yogurt and a cup of strawberries" and clicks "Add Food":

1. AI analyzes the input and returns structured food items
2. System detects a similar saved meal ("Yogurt + strawberries")
3. The `SimilarMealPrompt` appears with "Use Saved Meal" and "Dismiss" buttons
4. **Bug**: If user clicks "Dismiss", the pending AI result is thrown away and nothing is logged

The user expects "Dismiss" to mean "I don't want the saved meal, log what I typed instead" - but currently it just discards everything.

### Solution

Update the `dismissSimilarMatch` handler to log the pending AI result before clearing state:

**File**: `src/pages/FoodLog.tsx`

```typescript
// Current (broken):
const dismissSimilarMatch = useCallback(() => {
  setSimilarMatch(null);
  setPendingAiResult(null);
}, []);

// Fixed:
const dismissSimilarMatch = useCallback(() => {
  if (pendingAiResult) {
    // User dismissed the saved meal suggestion - log the AI-analyzed items instead
    createEntryFromItems(pendingAiResult.items, pendingAiResult.text);
  }
  setSimilarMatch(null);
  setPendingAiResult(null);
}, [pendingAiResult, createEntryFromItems]);
```

### Behavior After Fix

| Action | Result |
|--------|--------|
| Click "Use Saved Meal" | Logs the saved meal's items (existing behavior) |
| Click "Dismiss" | **Logs the AI-analyzed items from user's input** (fixed) |
| Click X button | Same as Dismiss - logs AI result |

### Single File Change

| File | Change |
|------|--------|
| `src/pages/FoodLog.tsx` | Update `dismissSimilarMatch` to call `createEntryFromItems` with `pendingAiResult` |


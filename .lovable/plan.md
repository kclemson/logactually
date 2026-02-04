
## Fix: Coordinate Similar Meal Prompt and Save Suggestion Prompt

### Problem

The two features are stepping on each other:

1. **SimilarMealPrompt**: "Looks like your saved meal: Yogurt + strawberries. Use it?"
2. User clicks "Dismiss" (meaning: "No, log what I typed instead")
3. Entry gets logged...
4. **SaveSuggestionPrompt**: "You've logged similar items 12 times. Save as meal?"

This is nonsensical - they already HAVE a saved meal for this pattern! The prompt in step 4 should never appear.

### Root Cause

The `dismissSimilarMatch` handler logs the entry via `createEntryFromItems`, which then runs `detectRepeatedFoodEntry`. The detection logic doesn't know that:
1. The user already has a saved meal matching this pattern
2. They just deliberately chose not to use it

### Solution

Skip the Save Suggestion detection when an entry is created as a result of dismissing a Similar Meal prompt. This can be done by passing a flag to `createEntryFromItems`.

```text
Flow BEFORE fix:
─────────────────
Similar Meal detected → User dismisses → createEntryFromItems() 
                                                    ↓
                                         detectRepeatedFoodEntry() runs
                                                    ↓
                                         Save Suggestion shown ❌

Flow AFTER fix:
───────────────
Similar Meal detected → User dismisses → createEntryFromItems(skipSaveSuggestion: true)
                                                    ↓
                                         Detection skipped ✓
                                         No prompt ✓
```

### Implementation

**File**: `src/pages/FoodLog.tsx`

**Change 1**: Add optional `skipSaveSuggestion` parameter to `createEntryFromItems`

```typescript
// Before:
const createEntryFromItems = useCallback(async (
  items: FoodItem[], 
  rawInput: string | null, 
  sourceMealId?: string
) => {

// After:
const createEntryFromItems = useCallback(async (
  items: FoodItem[], 
  rawInput: string | null, 
  sourceMealId?: string,
  skipSaveSuggestion?: boolean  // NEW
) => {
```

**Change 2**: Use the flag in the detection logic

```typescript
// Before:
if (!isReadOnly && settings.suggestMealSaves && recentEntries && !sourceMealId) {
  const suggestion = detectRepeatedFoodEntry(items, recentEntries);
  // ...
}

// After:
if (!isReadOnly && settings.suggestMealSaves && recentEntries && !sourceMealId && !skipSaveSuggestion) {
  const suggestion = detectRepeatedFoodEntry(items, recentEntries);
  // ...
}
```

**Change 3**: Pass `true` when dismissing a similar meal prompt

```typescript
// Before:
const dismissSimilarMatch = useCallback(() => {
  if (pendingAiResult) {
    createEntryFromItems(pendingAiResult.items, pendingAiResult.text);
  }
  setSimilarMatch(null);
  setPendingAiResult(null);
}, [pendingAiResult, createEntryFromItems]);

// After:
const dismissSimilarMatch = useCallback(() => {
  if (pendingAiResult) {
    // User already has a saved meal but chose not to use it - don't suggest saving again
    createEntryFromItems(pendingAiResult.items, pendingAiResult.text, undefined, true);
  }
  setSimilarMatch(null);
  setPendingAiResult(null);
}, [pendingAiResult, createEntryFromItems]);
```

### Why This Works

| Scenario | Behavior |
|----------|----------|
| Normal entry (no saved meal match) | Detection runs, may show Save Suggestion |
| Entry from saved meal (`sourceMealId` set) | Already skipped by existing `!sourceMealId` check |
| **Entry from dismissing Similar Meal prompt** | **Now skipped via `skipSaveSuggestion: true`** |

### Single File Change

| File | Changes |
|------|---------|
| `src/pages/FoodLog.tsx` | Add `skipSaveSuggestion` parameter; pass `true` in `dismissSimilarMatch` |

### Edge Case Consideration

The user might want to save a *modified* version of the meal. However, in this flow they're dismissing the similar meal prompt to log what they typed - they're not editing the items. If they wanted a saved meal, they would have clicked "Use Saved Meal". The current UX correctly assumes "Dismiss" means "I don't want to deal with saved meals right now."

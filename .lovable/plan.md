

## Fix: Direct Save for "Save as Meal" (No Toast)

### Problem

When clicking "Save as Meal" from the save suggestion prompt, it opens an empty dialog instead of directly saving. This is the same issue we just fixed for weight routines.

### Solution

Replace the dialog-opening logic with a direct `saveMeal.mutate()` call. The prompt will silently close on success - no toast confirmation needed.

---

### Implementation

**Update `src/pages/FoodLog.tsx`:**

**1. Replace `handleSaveSuggestion`:**

```typescript
const handleSaveSuggestion = useCallback(() => {
  if (saveSuggestionItems.length === 0) return;
  
  // Generate name from first item (same logic as FOOD_CONFIG.getFallbackName)
  const first = saveSuggestionItems[0].description;
  const autoName = first.replace(/\s*\([^)]*\)\s*$/, '').trim() || first;
  
  saveMeal.mutate({
    name: autoName,
    originalInput: null,
    foodItems: saveSuggestionItems,
  }, {
    onSuccess: () => {
      setSaveSuggestion(null);
      setSaveSuggestionItems([]);
    }
  });
}, [saveSuggestionItems, saveMeal]);
```

**2. Remove redundant state/components:**
- Remove `createMealFromSuggestion` state (line 77)
- Remove `handleMealFromSuggestionCreated` callback (lines 324-327)
- Remove the "Create Meal from Suggestion Dialog" JSX block

**3. Add loading state:**
- Pass `isLoading={saveMeal.isPending}` to `SaveSuggestionPrompt`

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/FoodLog.tsx` | Replace dialog-opening with direct `saveMeal.mutate()` call; remove redundant state/dialog; add loading prop |

---

### Behavior After Fix

1. User sees save suggestion with editable food items
2. User clicks "Save as Meal"
3. Prompt silently closes, meal is saved in background
4. No toast, no dialog, no interruption


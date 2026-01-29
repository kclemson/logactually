

## Remove AI Meal Name Suggestion Feature

### Overview

Remove the AI-powered meal name generation that runs when saving a meal. Instead, the name field will immediately show a fallback name (first food item's description) so users can save instantly without waiting.

---

### Files to Modify/Delete

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useSuggestMealName.ts` | **Delete** | The hook that calls the edge function |
| `supabase/functions/suggest-meal-name/` | **Delete** | The edge function directory |
| `src/components/SaveMealDialog.tsx` | **Simplify** | Remove AI suggestion props and loading states |
| `src/components/CreateSavedDialog.tsx` | **Simplify** | Remove suggestName logic and loading UI |
| `src/components/CreateMealDialog.tsx` | **Simplify** | Remove useSuggestMealName hook |
| `src/pages/FoodLog.tsx` | **Simplify** | Remove suggestName usage and related state |

---

### Implementation Details

**1. SaveMealDialog.tsx**

Remove:
- `suggestedName` and `isSuggestingName` props
- `useEffect` that waits for AI suggestion
- Loading spinner and "Generating suggested meal name..." UI
- `isGenerating` derived state

Replace with:
- Initialize `name` directly with `getFallbackName(foodItems)` on mount

**2. CreateSavedDialog.tsx**

Remove:
- `suggestNameResult` prop entirely from interface
- The background name suggestion logic in `handleSubmit` (lines 138-147)
- `isGeneratingName` derived state
- Loading spinner UI in the name input field (lines 232-250)

Replace with:
- Set name to `config.getFallbackName(result)` immediately after analysis completes

**3. CreateMealDialog.tsx**

Remove:
- `useSuggestMealName` import and hook call
- `suggestNameResult` prop passed to CreateSavedDialog

**4. FoodLog.tsx**

Remove:
- `useSuggestMealName` import (line 19)
- `suggestName, isLoading: isSuggestingName` from hook destructure (line 76)
- `suggestedMealName` state and setter (line 50)
- AI name suggestion call in `handleSaveAsMeal` (lines 349-351)
- `suggestedName` and `isSuggestingName` props from SaveMealDialog

**5. Delete files**

- `src/hooks/useSuggestMealName.ts` - No longer needed
- `supabase/functions/suggest-meal-name/index.ts` - Edge function no longer called

---

### Behavior After Changes

When saving a meal:
1. Dialog opens immediately
2. Name field is pre-populated with the first item's description (cleaned of portion info)
3. User can edit the name or accept the default
4. No waiting, no loading spinners for name generation


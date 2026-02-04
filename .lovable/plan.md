

## Simplification: Remove "Similar Saved Meal" Detection Only

### Summary

You want to **KEEP** both of these features:
1. **SimilarEntryPrompt** - "Looks like your entry from Wed, Jan 29" (history reference detection for "yesterday", "leftovers", etc.)
2. **SaveSuggestionPrompt** - "You've logged similar items X times. Save for quick access?" (drives saved meal adoption)

And **REMOVE** only:
- **SimilarMealPrompt** - "Looks like your saved meal: Hot Dog Bun" (matches against existing saved meals)

---

### Changes

#### 1. DELETE File
| File | Reason |
|------|--------|
| `src/components/SimilarMealPrompt.tsx` | UI for matching against existing saved meals |

#### 2. MODIFY `src/pages/FoodLog.tsx`

**Remove imports:**
- `SimilarMealPrompt` component
- `findSimilarMeals`, `createItemsSignature`, `SimilarMealMatch` from text-similarity

**Remove state (lines 64-68):**
- `similarMatch`, `setSimilarMatch`
- `pendingAiResult`, `setPendingAiResult`

**Remove handlers:**
- `handleUseSaved` (lines 320-328)
- `dismissSimilarMatch` (lines 330-337)

**Simplify `handleSubmit` (lines 301-312):**
- Remove the block that checks `savedMeals` and calls `findSimilarMeals`
- After AI returns, just call `createEntryFromItems` directly

**Simplify `dismissEntryMatch` (lines 391-401):**
- Remove the similar meal check after AI fallback
- Just call `createEntryFromItems` directly

**Remove from JSX (lines 645-655):**
- The `SimilarMealPrompt` render block

**Remove prop from LogInput (line 619):**
- `onDismissSimilarMatch` is no longer needed

#### 3. MODIFY `src/lib/text-similarity.ts`

**Remove (no longer called):**
- `findSimilarMeals()` function
- `createItemsSignature()` function  
- `SimilarMealMatch` type

**Keep (still used):**
- `jaccardSimilarity()` - used by repeated-entry-detection.ts
- `preprocessText()` - used by repeated-entry-detection.ts
- `expandAbbreviations()` - general utility
- `findSimilarEntry()` - used by SimilarEntryPrompt
- `SimilarEntryMatch` type

#### 4. MODIFY `src/components/LogInput.tsx`

**Remove prop:**
- `onDismissSimilarMatch` from interface and usage

---

### What Remains Active After This Change

| Feature | Trigger | User Sees |
|---------|---------|-----------|
| **History Reference Detection** | User types "yesterday's lunch", "leftovers", "last Tuesday" | `SimilarEntryPrompt`: "Looks like your entry from Tue, Feb 3 (85% match)" with "Use Past Entry" button |
| **Repeated Pattern Detection** | User logs similar items 2+ times manually | `SaveSuggestionPrompt`: "You've logged similar items 5 times. Save for quick access?" with "Save as Meal" button |

---

### Files Summary

| Action | File | Lines Changed |
|--------|------|---------------|
| DELETE | `src/components/SimilarMealPrompt.tsx` | ~65 lines |
| MODIFY | `src/pages/FoodLog.tsx` | Remove ~50 lines |
| MODIFY | `src/lib/text-similarity.ts` | Remove ~40 lines |
| MODIFY | `src/components/LogInput.tsx` | Remove prop |


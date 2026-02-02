

## Bug Fix: Saved Meals Shuffle Mismatch

### Problem Identified

The saved meals show 0 calories because of a **shuffle mismatch** between parsing and generation:

1. **AI Parsing (line 702-703)**: Slices first 5 templates, then parses them
   ```typescript
   const savedMealInputs = SAVED_MEAL_TEMPLATES.slice(0, savedMealsCount)
     .map(t => t.items.join(', '));
   // Parses: "Morning Coffee", "Chipotle Bowl", "Weeknight Salmon", "Protein Snack", "Pizza Night"
   ```

2. **Generation (line 532)**: Shuffles ALL templates, then slices first 5
   ```typescript
   const templates = shuffleArray(SAVED_MEAL_TEMPLATES).slice(0, count);
   // Could pick: "Pizza Night", "Post-Workout", "Lunch Salad", "Quick Breakfast", "Chipotle Bowl"
   ```

3. **Cache lookup (line 536)**: Looks for the shuffled templates in the cache
   ```typescript
   const parsedItems = parsedCache.get(originalInput) || [];
   // "Post-Workout" and "Lunch Salad" were never parsed → returns [] → uses fallback with 0 values
   ```

### Solution

Change the AI parsing to parse ALL templates, not just the first N. This ensures any shuffled combination will find its cached data.

---

### Changes

| File | Change |
|------|--------|
| `supabase/functions/populate-demo-data/index.ts` | Parse all 8 saved meal templates instead of just the first `savedMealsCount` |

---

### Implementation

**Before (line 702-703):**
```typescript
const savedMealInputs = SAVED_MEAL_TEMPLATES.slice(0, savedMealsCount)
  .map(t => t.items.join(', '));
```

**After:**
```typescript
// Parse ALL templates so any shuffled selection will have cached data
const savedMealInputs = SAVED_MEAL_TEMPLATES.map(t => t.items.join(', '));
```

This adds only 3 more items to the single batch (8 total vs 5), no additional AI calls needed since batch size is 10.

---

### Why This Works

With all 8 templates parsed upfront:
- Shuffle can pick any 5 of 8 templates
- All 8 are in the cache
- Every lookup succeeds
- Real macros displayed instead of zeros

---

### Technical Notes

- Change is on line 702-703 in `doPopulationWork` function
- Single line change, low risk
- No performance impact (still 1 batch for 8 items)
- The generation shuffle remains useful for variety in which meals appear


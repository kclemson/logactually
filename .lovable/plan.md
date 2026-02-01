


## Fix Empty Food Detection (Server-Side Validation)

Add server-side validation to `analyze-food` to filter out placeholder items with zero calories/macros, matching the validation pattern used in `analyze-weights`.

---

### Root Cause

| Edge Function | Server-Side Validation | Result with non-matching input |
|---------------|------------------------|--------------------------------|
| analyze-weights | Lines 204-211: Throws error if exercise lacks weight OR cardio data | Error returned → hook shows error → no entry saved |
| analyze-food | **None** - passes through any AI response | AI returns placeholder item → passes hook's `length > 0` check → ghost entry saved |

The AI returned a placeholder:
```json
{"food_items": [{"description": "No food identified", "calories": 0, "protein": 0, ...}]}
```

Since `length === 1`, the hook's empty check passed.

---

### Solution

Filter out zero-calorie/zero-macro items **in the edge function** before returning. This matches the analyze-weights pattern of validating data quality server-side.

---

### Technical Changes

#### 1. Add Validation in analyze-food Edge Function

**File: `supabase/functions/analyze-food/index.ts`**

After line 198 (after `mergedItems` is created), add filtering:

```typescript
// Filter out placeholder items (all macros zero = AI couldn't identify real food)
const validItems = mergedItems.filter(item => 
  item.calories > 0 || item.protein > 0 || item.carbs > 0 || item.fat > 0
);
```

Then update the totals calculation (line 201) and response (line 215) to use `validItems` instead of `mergedItems`.

---

#### 2. Database Cleanup

Delete the ghost entry created during testing:

```sql
DELETE FROM food_entries 
WHERE id = '7c3dcf52-f813-4d87-bde2-4c9247acaf8d';
```

---

### Why This Works

1. Edge function filters out zero-calorie placeholder items
2. Returns empty `food_items: []` for non-food input
3. Existing hook code sees `length === 0`
4. Warning is displayed, no entry saved

---

### Pattern Comparison

| Component | analyze-weights | analyze-food (after fix) |
|-----------|-----------------|--------------------------|
| Validation | `hasWeightData OR hasCardioData` | `calories > 0 OR protein > 0 OR carbs > 0 OR fat > 0` |
| On failure | Throws error | Filters item out |
| Empty result | `exercises: []` | `food_items: []` |
| Hook behavior | Shows warning | Shows warning |

---

### Summary

| Step | File | Change |
|------|------|--------|
| 1 | `supabase/functions/analyze-food/index.ts` | Filter out items where all macros are zero |
| 2 | Database | Delete ghost entry `7c3dcf52-f813-4d87-bde2-4c9247acaf8d` |



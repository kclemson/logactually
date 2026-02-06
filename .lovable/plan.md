

## Fix: Strip `editedFields` When Logging Saved Meals

### Summary

Only saved meals are affected by the asterisk bug. Saved routines use a separate `SavedExerciseSet` type that explicitly excludes `editedFields`, so they're already clean.

---

### Single File Change

**File: `src/hooks/useSavedMeals.ts`**

Update `useLogSavedMeal` (around line 157) to strip `editedFields` when returning items:

```typescript
// Current:
return (meal.food_items as unknown as FoodItem[]) ?? [];

// Fixed:
const items = (meal.food_items as unknown as FoodItem[]) ?? [];
return items.map(({ editedFields, ...rest }) => rest as FoodItem);
```

---

### Why Routines Don't Need This

| Aspect | Saved Meals | Saved Routines |
|--------|-------------|----------------|
| Storage type | `FoodItem[]` (includes `editedFields`) | `SavedExerciseSet[]` (excludes `editedFields`) |
| Logging return type | `FoodItem[]` | `SavedExerciseSet[]` |
| Issue present? | Yes | No |

The weight tracking feature was designed with a separate "clean" type (`SavedExerciseSet`) specifically for persistence, while food tracking reuses the full `FoodItem` type throughout. This is a good pattern - we might consider adding a similar `SavedFoodItem` type in the future, but for now, stripping at log-time is the minimal fix.

---

### Result After Fix

- Log "ChocZero white chocolate square" → appears **without** asterisk
- View saved meal in Settings → asterisk still visible (historical context preserved)
- Edit something after logging → asterisk appears correctly


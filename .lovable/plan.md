

## Handle "Save as meal" Link for Already-Saved Meals

### The Problem
When a user logs a saved meal (via the Saved Meals popover), expanding that entry still shows the "Save as meal" link. This is confusing since the meal is already saved.

### Solution Options Considered

| Approach | Pros | Cons |
|----------|------|------|
| **A: Add `source_meal_id` to `food_entries`** | Full tracking, can show meal name, link to settings | Requires database migration, more complex |
| **B: Hide expando for saved-meal entries** | Simple, no DB change needed | Loses ability to review raw input (which is null anyway for saved meals) |
| **C: Match items_signature against saved meals** | No DB change, can detect similarity | Expensive to compute on every render, may have false positives |

**Recommended: Option A** - Add a `source_meal_id` column to track when an entry came from a saved meal. This enables showing "Saved meal: [name]" with a link to view saved meals.

### Implementation

#### 1. Database Migration
Add an optional `source_meal_id` column to `food_entries`:

```sql
ALTER TABLE public.food_entries
ADD COLUMN source_meal_id UUID REFERENCES public.saved_meals(id) ON DELETE SET NULL;
```

#### 2. Update Types
Update `FoodEntry` interface in `src/types/food.ts`:

```typescript
export interface FoodEntry {
  // ... existing fields
  source_meal_id: string | null;  // NEW
}
```

#### 3. Update Entry Creation Flow
Modify `createEntryFromItems` in `src/pages/FoodLog.tsx` to accept an optional `sourceMealId`:

```typescript
const createEntryFromItems = useCallback((
  items: FoodItem[], 
  rawInput: string | null,
  sourceMealId?: string  // NEW parameter
) => {
  // ... existing logic
  createEntry.mutate({
    // ... existing fields
    source_meal_id: sourceMealId ?? null,  // NEW
  });
});
```

Update `handleUseSaved` and `handleLogSavedMeal` to pass the meal ID:

```typescript
const handleUseSaved = async () => {
  if (!similarMatch) return;
  const foodItems = await logSavedMeal.mutateAsync(similarMatch.meal.id);
  createEntryFromItems(foodItems, similarMatch.meal.original_input, similarMatch.meal.id);
  // ...
};

const handleLogSavedMeal = async (foodItems: FoodItem[], mealId?: string) => {
  createEntryFromItems(foodItems, null, mealId);
};
```

#### 4. Update SavedMealsPopover
Pass the meal ID when selecting a saved meal:

```typescript
// In SavedMealsPopover.tsx
onSelectMeal: (foodItems: FoodItem[], mealId: string) => void;

const handleSelectMeal = async (meal: SavedMeal) => {
  const foodItems = await logMeal.mutateAsync(meal.id);
  onSelectMeal(foodItems, meal.id);  // Pass ID
  onClose?.();
};
```

#### 5. Track Meal Names for Display
Build a map of entry ID to meal name in `FoodLogContent`:

```typescript
const entryMealNames = useMemo(() => {
  const map = new Map<string, string>();
  entries.forEach(entry => {
    if (entry.source_meal_id && savedMeals) {
      const meal = savedMeals.find(m => m.id === entry.source_meal_id);
      if (meal) map.set(entry.id, meal.name);
    }
  });
  return map;
}, [entries, savedMeals]);
```

#### 6. Update FoodItemsTable
Add new props and conditional rendering:

```typescript
// New props
entryMealNames?: Map<string, string>;

// In expanded section (lines 514-538):
{isLastInEntry && isCurrentExpanded && (
  <div className="col-span-full pl-6 py-1 space-y-2">
    {/* Show raw input if present */}
    {currentRawInput && (
      <p className="text-muted-foreground whitespace-pre-wrap italic">
        {currentRawInput}
      </p>
    )}
    
    {/* Either show "Saved meal: name" OR "Save as meal" link */}
    {currentMealName ? (
      <p className="text-sm text-muted-foreground">
        Saved meal: <span className="font-medium">{currentMealName}</span>
      </p>
    ) : onSaveAsMeal && currentEntryId && (
      <button onClick={...} className="text-sm text-blue-600 underline">
        Save as meal
      </button>
    )}
  </div>
)}
```

### Files to Change

| File | Changes |
|------|---------|
| Database migration | Add `source_meal_id` column to `food_entries` |
| `src/types/food.ts` | Add `source_meal_id` to `FoodEntry` interface |
| `src/hooks/useFoodEntries.ts` | Include `source_meal_id` in create mutation |
| `src/pages/FoodLog.tsx` | Pass `sourceMealId` through entry creation, build meal name map, pass to table |
| `src/components/SavedMealsPopover.tsx` | Update callback signature to include meal ID |
| `src/components/FoodInput.tsx` | Update `onLogSavedMeal` prop signature |
| `src/components/FoodItemsTable.tsx` | Add `entryMealNames` prop, conditional display logic |

### User Experience Result
- Entries created from AI analysis: Show "Save as meal" link when expanded
- Entries created from saved meals: Show "Saved meal: [name]" instead (no confusing "Save as meal" option)


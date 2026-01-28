

## Use Optimistic Updates to Prevent List Reordering

Instead of refetching the entire saved meals list after an edit, directly update the cached data in place using React Query's `setQueryData`. This preserves list order and eliminates the network round-trip.

---

### Current Flow (Causes Jump)

```
Edit → Mutation → invalidateQueries → Full DB Refetch → New Order
```

### New Flow (No Jump)

```
Edit → Mutation → setQueryData (update in place) → Same Order
```

---

### Implementation

**Step 1: Modify `useUpdateSavedMeal` in `useSavedMeals.ts`**

Replace `invalidateQueries` with `setQueryData` that surgically updates the specific meal:

```typescript
export function useUpdateSavedMeal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, name, foodItems }: UpdateSavedMealParams) => {
      // ... existing mutation logic ...
      return data;
    },
    onSuccess: (updatedMeal, variables) => {
      // Update cache in place instead of refetching
      queryClient.setQueryData(
        ['saved-meals', user?.id],
        (oldData: SavedMeal[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(meal => 
            meal.id === variables.id 
              ? { 
                  ...meal, 
                  ...updatedMeal,
                  food_items: (updatedMeal.food_items as unknown as FoodItem[]) ?? meal.food_items,
                }
              : meal
          );
        }
      );
    },
  });
}
```

**Step 2: Apply same pattern to `useSavedRoutines.ts`**

Update `useUpdateSavedRoutine` with the same optimistic update approach.

---

### Technical Details

| Hook | Current Approach | New Approach |
|------|-----------------|--------------|
| `useUpdateSavedMeal` | `invalidateQueries` → refetch | `setQueryData` → update in place |
| `useUpdateSavedRoutine` | `invalidateQueries` → refetch | `setQueryData` → update in place |

The mutation already returns the updated row via `.select().single()`, so we have all the data needed to update the cache without a separate fetch.

---

### Benefits

1. **No list jumping** - items stay in their current position
2. **Faster feedback** - no network round-trip for UI update
3. **Reduced server load** - one less query per edit

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useSavedMeals.ts` | Replace `invalidateQueries` with `setQueryData` in `useUpdateSavedMeal` |
| `src/hooks/useSavedRoutines.ts` | Replace `invalidateQueries` with `setQueryData` in `useUpdateSavedRoutine` |


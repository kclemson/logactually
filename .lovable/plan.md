

## Add saved meals as typeahead candidates

**`src/pages/FoodLog.tsx`** — after the recent-entries loop (line 174), add a second loop over `savedMeals` to insert them as candidates. Update the `useMemo` dependency array to include `savedMeals`.

```tsx
// After line 173 (closing brace of the recent-entries loop), add:

// Add saved meals as candidates so meal names are searchable
if (savedMeals?.length) {
  for (const meal of savedMeals) {
    const key = `saved-meal:${meal.id}`;
    if (candidates.has(key)) continue;
    const totalCal = meal.food_items.reduce((sum, i) => sum + (i.calories || 0), 0);
    candidates.set(key, {
      label: meal.name,
      searchText: [meal.name, meal.original_input, ...meal.food_items.map(i => i.description)].filter(Boolean).join(' '),
      subtitle: `${Math.round(totalCal)} cal`,
      timestamp: meal.last_used_at ?? meal.created_at,
      frequency: Math.max(1, meal.use_count ?? 1),
      items: meal.food_items,
    });
  }
}
```

Update the `useMemo` dependency (line 186) from `[recentEntries]` to `[recentEntries, savedMeals]`.

No other files need changes — the existing `handleSelectTypeahead` already handles multi-item payloads correctly.


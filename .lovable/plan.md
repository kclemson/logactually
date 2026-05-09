## Change

In `src/components/SavedMealsPopover.tsx`, drop the `N items` segment from the right-side meta chip so each saved-meal row shows only the calorie count.

Before:
```
Strawberries + Chobani pr…   2 items · 190 cal
```

After:
```
Strawberries + Chobani pr…   190 cal
```

## Implementation

In the row render, replace:
```tsx
{meal.food_items.length} item{meal.food_items.length !== 1 ? 's' : ''} · {Math.round(totals.calories)} cal
```
with:
```tsx
{Math.round(totals.calories)} cal
```

That frees ~60–70px on each row, which should let most meal names display without truncation at the current `w-72` width. We'll keep the popover width and button order as-is for now and reassess after seeing the result.

## Out of scope

- No change to the saved routines popover (still shows `N exercise(s)`, since routines often share generic names like "Lat Pulldown" and the count is the only differentiator)
- No popover width or button-order changes

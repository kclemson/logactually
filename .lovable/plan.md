

## Fix chart DSL: category filter + prompt improvements

### What's changing

Two focused fixes to make exercise category queries and the prompt work correctly:

1. **Add a category filter for exercises** -- so you can ask things like "cardio count by day of week" (filter to cardio only, group by weekday)
2. **Improve the AI prompt** -- stronger guidance on when to use `groupBy: "category"` vs `filter.category`, and clarify that `entries` means the count of food items logged

### What we're NOT doing

Dropping the idea of a separate `food_items_count` metric. The existing `entries` metric will simply be documented as "number of food items logged" -- users think of it as the same thing, so we'll keep it simple.

### Technical details

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `category?: "Cardio" \| "Strength"` to the `filter` interface |
| `src/lib/chart-data.ts` | In `fetchExerciseData`, when `filter.category` is set, skip rows that don't match using `isCardioExercise()` |
| `src/lib/chart-dsl.ts` | No changes needed (filter is applied at the data layer) |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `category` filter to the prompt schema. Add guidance distinguishing `groupBy: "category"` (compare cardio vs strength) from `filter.category` (isolate one category, group by something else). Clarify `entries` as "number of food items logged." |

### How the category filter works

```text
User: "Cardio sessions by day of week"

AI returns:
  source: "exercise"
  metric: "sets"
  aggregation: "sum"
  groupBy: "dayOfWeek"
  filter: { category: "Cardio" }

User: "Cardio vs strength split"

AI returns:
  source: "exercise"
  metric: "sets"
  groupBy: "category"
  filter: null
```

In `fetchExerciseData`:
```typescript
if (categoryFilter) {
  const isCardio = isCardioExercise(row.exercise_key);
  if (categoryFilter === "Cardio" && !isCardio) continue;
  if (categoryFilter === "Strength" && isCardio) continue;
}
```


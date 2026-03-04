

## Fix: String-typed numbers in food macro totals

### Root cause

The AI model occasionally returns JSON with string-typed numbers (e.g., `"protein": "25"` instead of `"protein": 25`). The `useAnalyzeFood` hook spreads the AI response items verbatim — no numeric coercion. These strings get saved to the `food_items` JSONB column. When `calculateTotals()` sums them, JavaScript's `+` operator concatenates strings instead of adding numbers: `0 + "25" + "31" + "5"` → `"025315"`.

### Fix (three layers)

**1. `src/hooks/useAnalyzeFood.ts`** — Coerce at ingestion (prevents bad data from being written)

When mapping AI response items (line 57), explicitly `Number()` all numeric fields instead of spreading raw:

```ts
const itemsWithIds = data.food_items.map((item) => ({
  description: item.description || '',
  portion: item.portion,
  calories: Number(item.calories) || 0,
  protein: Number(item.protein) || 0,
  carbs: Number(item.carbs) || 0,
  // ... all numeric fields
  uid: crypto.randomUUID(),
}));
```

**2. `src/types/food.ts` — `calculateTotals()`** — Defense-in-depth for any data already stored as strings

Wrap each accumulator addition with `Number()`:

```ts
protein: acc.protein + Number(item.protein || 0),
```

**3. `src/hooks/useFoodEntries.ts` and `src/hooks/useRecentFoodEntries.ts`** — Coerce during JSONB parsing

Both hooks parse raw JSONB items. Change `item.protein || 0` to `Number(item.protein) || 0` for all numeric fields. This fixes display for any existing bad data already in the database.

### Scope

Four files, small changes each. No DB migration needed — the stored JSONB strings will be correctly interpreted going forward.


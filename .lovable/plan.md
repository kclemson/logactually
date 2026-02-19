

## Expand derived formulas + cross-domain verification

### What changes

**Single file: `src/lib/chart-verification.ts`**

#### 1. Update `DerivedFormula` interface for mixed-source support

Change `source` to allow `"mixed"`, and change `compute` signature to accept two optional records (food + exercise):

```text
interface DerivedFormula {
  source: "food" | "exercise" | "mixed";
  compute: (food: any, exercise?: any) => number;
  tolerance: "percentage" | "default";
}
```

Existing single-source formulas get updated signatures but behavior stays the same (they just ignore the second argument).

#### 2. Add new derived formulas

**Food-domain (completing the set):**
- `net_carbs` = carbs - fiber
- `carbs_per_meal` = carbs / entries
- `fat_per_meal` = fat / entries
- `fiber_per_meal` = fiber / entries
- `sodium_per_meal` = sodium / entries
- `protein_fat_ratio` = protein / fat

**Exercise-domain:**
- `sets_per_exercise` = sets / unique_exercises

**Cross-domain (mixed):**
- `net_calories`, `calorie_balance` = food cal - exercise cal_burned
- `protein_per_set` = food protein / exercise sets

#### 3. Update `verifyLegacy` for mixed-source

Currently the function bails immediately when `dataSource === "mixed"`. The change:
- Move the mixed guard to AFTER the derived formula lookup
- If a mixed-source formula matches the dataKey, proceed with verification by looking up both `dailyTotals.food[date]` and `dailyTotals.exercise[date]` and passing both to the compute function
- If no mixed formula matches and dataSource is mixed, bail as before

#### 4. Update `verifyDaily` for mixed-source cross-check

Same pattern: when a mixed-source derived formula exists for the dataKey, use both food and exercise records instead of the AI's declared single source.

### No other files change

This is purely expanding the verification mapping table and making the existing loop handle two record sources instead of one. No UI changes, no edge function changes, no new dependencies.


## ✅ Expand derived formulas + cross-domain verification

**Completed.** Updated `src/lib/chart-verification.ts`:

1. `DerivedFormula.source` now supports `"mixed"`; `compute` accepts `(food, exercise?)` 
2. Added formulas: `net_carbs`, `carbs_per_meal`, `fat_per_meal`, `fiber_per_meal`, `sodium_per_meal`, `protein_fat_ratio`, `sets_per_exercise`, `net_calories`, `calorie_balance`, `protein_per_set`
3. `verifyLegacy` and `verifyDaily` now handle mixed-source formulas by looking up both food and exercise records per date


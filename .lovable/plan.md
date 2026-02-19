

## Add derived-formula verification for computable metrics

### Problem

Charts like "fat as % of total calories" show as unverifiable because the verifier only maps dataKeys to single fields. But `fat * 9 / cal * 100` is trivially computable from data we already have. The AI declaring these "derived metrics that can't be verified" is wrong -- we just never taught the verifier basic arithmetic.

### Solution

Add a `DERIVED_FORMULAS` map alongside the existing `FOOD_KEY_MAP`. Each entry defines a function that computes the expected value from a daily totals record. The legacy heuristic checks this map before giving up on an unknown dataKey.

### Formulas to support

| dataKey patterns | Formula | Why |
|---|---|---|
| `fat_pct`, `fat_percentage`, `fat_calories_pct` | `(fat * 9 / cal) * 100` | Shown in screenshot |
| `protein_pct`, `protein_percentage` | `(protein * 4 / cal) * 100` | Same pattern |
| `carbs_pct`, `carbs_percentage` | `(carbs * 4 / cal) * 100` | Same pattern |
| `cal_per_meal`, `calories_per_meal` | `cal / entries` | Uses new entries field |
| `protein_per_meal` | `protein / entries` | Insight chip we added |
| `fat_calories`, `calories_from_fat` | `fat * 9` | Simple derived |
| `protein_calories`, `calories_from_protein` | `protein * 4` | Simple derived |
| `carbs_calories`, `calories_from_carbs` | `carbs * 4` | Simple derived |

All formulas guard against division by zero (return 0 when denominator is 0).

### Technical details

**`src/lib/chart-verification.ts`:**

Add a new map after the existing key maps:

```text
DERIVED_FORMULAS: Record<string, {
  source: "food" | "exercise";
  compute: (record: any) => number;
}>
```

In `verifyLegacy`, after the existing `FOOD_KEY_MAP`/`EXERCISE_KEY_MAP` lookup fails, check `DERIVED_FORMULAS`. If a match is found, use its `compute` function instead of a field lookup. The rest of the verification logic (tolerance check, mismatch tracking) stays identical.

Use the percentage tolerance (`delta < 2 || relative < 0.02`) for percentage-type formulas since these are inherently noisier from rounding.

In `verifyDaily`, apply the same derived formula cross-check: if the heuristic has a derived formula for the dataKey, use it instead of the AI's declared field.

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-verification.ts` | Add `DERIVED_FORMULAS` map; update `verifyLegacy` and `verifyDaily` to use computed values for derived metrics |


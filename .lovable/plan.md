

## Rename DSL metric keys to match DB field names

### Problem

The internal metric keys (`cal`, `sat_fat`, `chol`, `duration`, `distance`, `cal_burned`) are arbitrary abbreviations that don't appear anywhere in the database schema. The AI sees column names like `calories`, `saturated_fat`, `cholesterol`, `duration_minutes`, `distance_miles`, `calories_burned` in the prompt, so it sometimes uses those instead of the short keys -- producing empty charts.

### Solution

Rename the internal keys to match the names the AI naturally encounters in the DB schema. This eliminates the mismatch at the source instead of working around it.

### Key renames

| Old key | New key | Matches |
|---|---|---|
| `cal` | `calories` | food_items JSONB field |
| `sat_fat` | `saturated_fat` | food_items JSONB field |
| `chol` | `cholesterol` | food_items JSONB field |
| `duration` | `duration_minutes` | weight_sets column |
| `distance` | `distance_miles` | weight_sets column |
| `cal_burned` | `calories_burned` | exercise_metadata JSONB field |

`protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `sets`, `entries`, `unique_exercises` already match naturally and stay the same.

### Files changed

| File | What changes |
|---|---|
| `src/lib/chart-types.ts` | Rename fields in `FoodDayTotals` (`cal` to `calories`, `sat_fat` to `saturated_fat`, `chol` to `cholesterol`) and `ExerciseDayTotals` (`duration` to `duration_minutes`, `distance` to `distance_miles`, `cal_burned` to `calories_burned`) |
| `src/lib/chart-data.ts` | Update `EMPTY_FOOD`, `EMPTY_EXERCISE` constants and all field references to use new names |
| `src/lib/chart-dsl.ts` | Update `FOOD_METRICS`, `EXERCISE_METRICS` arrays, `DERIVED_FORMULAS` references, `extractValue` usage, all `buildDetails` calls, and `metricColors` map to use new key names |
| `supabase/functions/generate-chart-dsl/index.ts` | Update the AVAILABLE METRICS section to list the new key names (`calories` instead of `cal`, etc.) |

### What does NOT change

- No database changes
- No UI changes
- `CompactChartTooltip.tsx` -- unchanged, renders whatever `_details` contains
- `DynamicChart.tsx` -- unchanged, passes data through
- `useGenerateChart.ts` -- unchanged, orchestrates but doesn't reference metric keys
- The `ChartDSL` interface itself -- `metric` is still a `string`, only the valid values change

### Risk

Low. The metric keys are only used within the chart pipeline (chart-types, chart-data, chart-dsl, and the prompt). No other features reference these field names. Existing saved charts that stored a `chartDSL` with old metric names would need the old keys to still work -- we can add a small 6-line alias map in `executeDSL` that silently remaps old keys (`cal` to `calories`, etc.) so saved charts don't break.


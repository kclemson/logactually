

## Customizable Macro Display Slots — Phase 1

Make the hardcoded protein/carbs/fat display dynamic via a `displayMacros` setting that defaults to `['protein', 'carbs', 'fat']`. No UI to change it yet — Phase 1 just wires the plumbing so we can test for regressions before adding customizability.

### Key architectural decision: Trends page data availability

The `food_entries` table only has `total_calories`, `total_protein`, `total_carbs`, `total_fat` as columns. Fiber, sugar, sodium, etc. live only inside the `food_items` JSONB array.

- **FoodLog page**: Already works — `calculateTotals(displayItems)` computes all 9 macros from JSONB items.
- **Trends page**: Queries only the 4 top-level columns. For non-P/C/F macros, we'd need to fetch `food_items` JSONB and sum client-side.

**Phase 1 approach**: Default is P/C/F, so no Trends query change yet. We parameterize the chart definitions so they read from `displayMacros`, but the data pipeline stays the same. Phase 2 (settings UI) will also handle fetching `food_items` in the Trends query when non-standard macros are selected.

---

### New file: `src/lib/macro-display.ts`

Metadata map, default tuple, and a `getMacroValue(item, key)` helper (handles `net_carbs = carbs - fiber` derivation). Available keys: `protein`, `carbs`, `fat`, `fiber`, `sugar`, `net_carbs`, `saturated_fat`, `sodium`, `cholesterol`.

### Files to modify (6 files)

| File | Change |
|------|--------|
| **`useUserSettings.ts`** | Add `displayMacros: [MacroKey, MacroKey, MacroKey]` field, default `['protein', 'carbs', 'fat']` |
| **`MacroSummary.tsx`** | Accept optional `displayMacros` prop; build items array dynamically via `getMacroValue` + `MACRO_META`. Calories row stays first (not configurable). |
| **`FoodItemsTable.tsx`** | Accept optional `displayMacros` prop. **7 locations** updated: (1) header "Protein/Carbs/Fat" → joined labels, (2) mini header "P/C/F" → joined short labels, (3) TotalsRow values, (4) TotalsRow percentages — hidden when not standard P/C/F, (5–6) two collapsed group row displays, (7) per-item rows (editable + read-only). Prop is optional, defaults to `DEFAULT_DISPLAY_MACROS`. |
| **`FoodEntryCard.tsx`** | Read `displayMacros` from `useUserSettings`, pass to `MacroSummary` and `FoodItemsTable` |
| **`FoodLog.tsx`** | Read `settings.displayMacros`, pass to `FoodItemsTable` |
| **`Trends.tsx`** | Build mini-chart `charts` array from `displayMacros` instead of hardcoding. The macro % chart and stacked chart stay hardcoded to P/C/F (calorie-composition only makes sense for the big 3). |

### Callers that DON'T need changes

`SaveMealDialog`, `SavedMealRow`, `CreateMealDialog`, `DemoPreviewDialog` — these use `FoodItemsTable` in preview contexts where P/C/F is always appropriate. The prop is optional and falls back to the default.

### Design details

- **`scaleMacrosByCalories`**: No change needed. It operates on P/C/F for calorie proportion math. The display layer just picks the right 3 values to show.
- **Percentage row**: Uses cal-per-gram (P×4, C×4, F×9) which only makes sense for the standard trio. When `displayMacros` differs from default, the percentage row is hidden (already controlled by `showMacroPercentages`).
- **`Settings.test.tsx`**: Add `displayMacros` to mock settings so tests don't break.

### Scope

1 new file, 6 modified files. Display-layer only — no database migration.


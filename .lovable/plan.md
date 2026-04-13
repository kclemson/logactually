

## Use medium-length `headerLabel` for food table column headers

### Changes

**`src/lib/macro-display.ts`**
- Add `headerLabel: string` to the `MacroMeta` interface
- Populate for each key:

| Key | label (settings) | headerLabel (table) |
|-----|----------|-------------|
| protein | Protein | Protein |
| carbs | Carbs | Carbs |
| fat | Fat | Fat |
| fiber | Fiber | Fiber |
| sugar | Sugar | Sugar |
| net_carbs | Net Carbs | NetCarbs |
| saturated_fat | Sat. Fat | SatFat |
| sodium | Sodium | Sodium |
| cholesterol | Cholesterol | Chol |

**`src/components/FoodItemsTable.tsx`** — Line 313: `.label` → `.headerLabel`

Two files, minimal changes.


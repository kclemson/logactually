

## Fix expanded group header to respect display macros

### Problem
Only one location is affected: **line 587** in `src/components/FoodItemsTable.tsx`. The collapsed group header (line 407) already correctly uses `displayMacros.map(key => getMacroValue(groupTotals, key))`. No other files have hardcoded macro references that need updating.

### Change — `src/components/FoodItemsTable.tsx`

1. **Lines 537-540**: Replace the 3 manual reduce calls (`groupProtein`, `groupCarbs`, `groupFat`) with `calculateTotals(groupItems)` assigned to a `groupTotals` variable (same pattern the collapsed path uses).

2. **Line 587**: Replace `{Math.round(groupProtein)}/{Math.round(groupCarbs)}/{Math.round(groupFat)}` with:
   ```tsx
   {displayMacros.map(key => Math.round(getMacroValue(groupTotals, key))).join('/')}
   ```

3. Keep `groupCalories` (line 537) since it's used independently on line ~583.

One file, ~5 lines changed. No other hardcoded references exist.


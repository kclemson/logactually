

## Refactor: Remove formatCalorieBurn and formatCalorieBurnTotal, standardize on formatCalorieBurnValue

### What changes

Remove the two "opinionated" formatters that bake in suffixes/labels. All call sites will use `formatCalorieBurnValue` (numeric-only) and add labels at the render site.

### Caller audit (complete)

| Function | File | Line | Status |
|---|---|---|---|
| `formatCalorieBurn` | `CalorieBurnDialog.tsx` | 132 | Needs update |
| `formatCalorieBurn` | `calorie-burn.test.ts` | 483-498 | Needs update |
| `formatCalorieBurnTotal` | `calorie-burn.test.ts` | 501-504 | Needs update |
| `formatCalorieBurnValue` | `WeightItemsTable.tsx` | 804 | Already migrated |
| `formatCalorieBurnValue` | `WeightLog.tsx` | 688 | Already migrated |
| `formatCalorieBurnSettingsSummary` | `Settings.tsx` | 266 | Unrelated, no change |

### Technical Details

**`src/lib/calorie-burn.ts`:**
- Delete `formatCalorieBurn` (lines 348-355)
- Delete `formatCalorieBurnTotal` (lines 357-365)
- Keep `formatCalorieBurnValue` and `formatCalorieBurnSettingsSummary`

**`src/components/CalorieBurnDialog.tsx`:**
- Change import from `formatCalorieBurn` to `formatCalorieBurnValue`
- Update line 132: use `formatCalorieBurnValue(result)` and append " cal" at the render site if the value is non-empty

**`src/lib/calorie-burn.test.ts`:**
- Remove `formatCalorieBurn` and `formatCalorieBurnTotal` test blocks
- Replace with `formatCalorieBurnValue` tests covering: range, exact, zero, equal low/high

### Files Changed
- `src/lib/calorie-burn.ts` -- remove two functions
- `src/components/CalorieBurnDialog.tsx` -- switch to new formatter
- `src/lib/calorie-burn.test.ts` -- update tests


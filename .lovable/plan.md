

## Clean Up Calorie Formatting at the Source

### What changes

Instead of calling `formatCalorieBurn()` and then stripping " cal" / " (reported)" suffixes, add a new lean formatter function that returns only the numeric range string.

### Technical Details

**`src/lib/calorie-burn.ts`:**

Add a new function `formatCalorieBurnValue` that returns just the numeric portion:

```ts
export function formatCalorieBurnValue(result: CalorieBurnResult): string {
  if (result.type === 'exact') {
    return `~${result.value}`;
  }
  if (result.low === 0 && result.high === 0) return '';
  if (result.low === result.high) return `~${result.low}`;
  return `~${result.low}-${result.high}`;
}
```

The existing `formatCalorieBurn` stays unchanged for any other call sites that still want the " cal" suffix.

**`src/components/WeightItemsTable.tsx`:**

- Import `formatCalorieBurnValue` instead of (or in addition to) `formatCalorieBurn`.
- Use `formatCalorieBurnValue` when building the expanded section calorie display, so no suffix stripping is needed.
- Single exercise: `Estimated calories burned: ~159-238`
- Multi-exercise: `Estimated calories burned: ~12-18 (Leg Extension), ~159-238 (Squat)`

**`src/pages/WeightLog.tsx`:**

- The total calorie display passed as a prop also currently uses `formatCalorieBurnTotal` which includes "Est. burn:" prefix. Check if this should also use the new lean formatter to build the `(~81-157 cal)` string more cleanly. Currently lines 678-698 already format it as `(${display})` -- switching to `formatCalorieBurnValue` + wrapping with `(${value} cal)` would be cleaner than stripping from `formatCalorieBurnTotal`.

### Files Changed
- `src/lib/calorie-burn.ts` -- add `formatCalorieBurnValue`
- `src/components/WeightItemsTable.tsx` -- use new formatter, no suffix stripping
- `src/pages/WeightLog.tsx` -- use new formatter for total display prop


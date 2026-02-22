

# Suppress generic details on compare charts, promote compare breakdown

## Problem
When a chart uses `compare` (like "Net Daily Calories"), the tooltip shows:
1. The net value (correct)
2. The compare breakdown line (correct, but small)
3. Generic daily metadata like "117 protein, 178 carbs, 65 fat..." (not useful here)

The generic `_details` row is a fallback for any date-axis chart. For compare charts, it adds noise and distracts from the actual breakdown the user cares about.

## Solution
When `dsl.compare` is active, skip the generic `_details` entirely. The compare breakdown already tells the user everything relevant. This is a one-line change in the date case and a similar one in the week case.

## Technical Details

**File: `src/lib/chart-dsl.ts`**

In the `date` case (~line 206), change the `_details` assignment to skip when compare is active:

```typescript
_details: dsl.compare ? [] : details,
```

In the `week` case, same pattern -- set `_details` to only show the "days" count (which is still useful context for weekly buckets), but omit the generic food/exercise metadata.

No changes needed in `CompactChartTooltip.tsx` since it already renders `_compareBreakdown` when present and skips empty `_details`.

| File | Change |
|---|---|
| `src/lib/chart-dsl.ts` | Set `_details` to empty array when `dsl.compare` is active (date and week cases) |


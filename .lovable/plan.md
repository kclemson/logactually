
## Add Daily Estimated Calorie Burn Chart to Trends Page

### Overview

Add a chart showing daily total estimated calorie burn as a **range bar** (not a midpoint) next to the existing Total Volume chart. Both become half-width in a 2-column grid. The range is visualized using a stacked bar technique: a transparent "base" bar from 0 to the low value, and a visible colored bar from low to high, so the user sees the actual spread of the estimate.

### Changes

**1. New file: `src/hooks/useDailyCalorieBurn.ts`**

A reusable hook that composes `useWeightTrends(days)` and `useUserSettings()`:
- Iterates all exercises and their `weightData` points
- Constructs `ExerciseInput` for each and calls `estimateCalorieBurn()`
- Aggregates `{ low, high }` per day
- Returns `{ data: Array<{ date, low, high }>, isLoading }`
- Reusable for future features (e.g., adjusting daily calorie target by burn)

**2. Update: `src/hooks/useWeightTrends.ts`**

- Add `exercise_metadata` to the `.select()` query and the `WeightPoint` interface
- Pass it through when building data points (needed for user-reported calorie overrides and incline data)

**3. New chart component in `src/components/trends/FoodChart.tsx`**

A `CalorieBurnChart` component using the **stacked bar with transparent base** pattern:
- Each data point has `{ date, base: low, band: high - low }`
- Two stacked `Bar` components: one with `fill="transparent"` (the base), one with the actual color (the visible band)
- Tooltip shows the range as `~low-high cal`
- Labels show the range in compact form
- Same touch/click interaction patterns as `VolumeChart`
- Uses a warm/orange color to distinguish from the purple volume chart

This approach honestly represents the range -- wide bars when the estimate is uncertain, narrow bars when the user has configured their settings well -- which naturally encourages users to fill in their calorie burn settings for tighter estimates.

**4. Update: `src/pages/Trends.tsx`**

- Import `useDailyCalorieBurn` and `CalorieBurnChart`
- Call the hook with `selectedPeriod`
- Replace the full-width Volume chart with a 2-column grid:
  - Total Volume chart (half-width)
  - Estimated Calorie Burn chart (half-width)
- Calorie burn chart hidden when `calorieBurnEnabled` is false or no data exists
- If only one chart has data, it still renders at half-width for layout consistency (or we can let it go full-width -- your call during review)

### Visual concept

```text
|  Total Volume (lbs)        |  Est. Calorie Burn          |
|  ____                      |                             |
| |    |       ____          |  ====        ====           |
| |    | ____ |    |         | |    |  ==  |    |          |
| |____|_|____|____|___      | |____|__|__|_|____|___      |
|  Mon  Tue  Wed  Thu        |  Mon  Tue  Wed  Thu        |

(==== = colored band from low to high, base is transparent)
```

### Edge cases

- `calorieBurnEnabled` is false: chart hidden
- No weight data: neither chart shows
- All exercises produce 0 estimates: chart hidden
- Days with exact user-reported calories: low === high, band === 0, renders as a thin line (acceptable)
- `exercise_metadata` query addition is backward-compatible (nullable column)

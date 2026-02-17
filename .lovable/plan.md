
# Fill date gaps in calorie burn chart + rename title

## Changes

### 1. `src/pages/Trends.tsx`

**Fill in rest days**: Update the `calorieBurnChartData` memo to generate a full continuous date range using `eachDayOfInterval` from `date-fns`. Days without exercise data will get zero-value entries (`low: 0, high: 0, midpoint: 0, exerciseCount: 0`), which render as empty gaps in the bar chart. This gives users a clear picture of exercise vs rest days.

**Rename chart title**: Change `"Estimated Daily Calorie Burn"` to `"Estimated Exercise Calorie Burn"` (line 425).

### Technical detail

In the `calorieBurnChartData` memo (~line 170):
- Import `eachDayOfInterval` from `date-fns`
- Build a lookup map from `dailyCalorieBurn` keyed by date string
- Generate the full date range: `eachDayOfInterval({ start: subDays(startOfDay(new Date()), selectedPeriod - 1), end: startOfDay(new Date()) })`
- Map over the full range, inserting zero entries for missing dates
- Compute label intervals based on the full range length (not just data-present days)

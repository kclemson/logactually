

# Calorie Burn Chart: Bar Labels + Exercise Breakdown Tooltip

## Changes

### 1. Enrich hook with exercise counts (`src/hooks/useDailyCalorieBurn.ts`)

Track unique exercise keys per date, splitting into cardio vs strength using `isCardioExercise` from `exercise-metadata.ts`.

New fields on `DailyCalorieBurn`:
- `exerciseCount` -- total distinct exercises
- `cardioCount` -- distinct cardio exercises  
- `strengthCount` -- distinct non-cardio exercises

Implementation: add a `Set<string>` per date to collect unique exercise keys, then count cardio/strength at the end.

### 2. Add bar labels (`src/components/trends/CalorieBurnChart.tsx`)

Follow the same pattern as `ExerciseChart.renderCardioLabel`:
- Import `LabelList` from recharts and `getFullWidthLabelInterval` from `chart-label-interval`
- Add `showLabel` field to `CalorieBurnChartData`
- Add a `renderLabel` function: renders midpoint value above bar at font size 7 in chart color, only when `showLabel` is true
- Add `<LabelList dataKey="midpoint" content={renderLabel} />` inside the `<Bar>`
- Increase top margin from 4 to 12 for label room

### 3. Enhanced tooltip (`src/components/trends/CalorieBurnChart.tsx`)

Update `BurnTooltip` to always show range + exercise breakdown:

- Line 1 (in chart color, bold): `~112 cal (range: 104-129)`
  - If low === high: `~112 cal`
- Line 2 (muted): `3 exercises (1 cardio, 2 strength)`
  - Omits categories with 0: `2 exercises (2 strength)` or `1 exercise (1 cardio)`
- "Go to day" button on touch devices (already present, stays as-is)

### 4. Wire up in `src/pages/Trends.tsx`

- Import `getFullWidthLabelInterval`
- Compute `showLabel` using right-to-left interval pattern
- Pass through `exerciseCount`, `cardioCount`, `strengthCount` from hook data

## Files changed

| File | What |
|------|------|
| `src/hooks/useDailyCalorieBurn.ts` | Track per-day exercise counts (cardio vs strength) |
| `src/components/trends/CalorieBurnChart.tsx` | Add LabelList + enrich tooltip with range and exercise breakdown |
| `src/pages/Trends.tsx` | Pass new fields + compute `showLabel` |




# Propagate distance unit preference across all UI

## Locations found

You identified the three main ones. Here's the complete audit:

### 1. WeightItemsTable gray italic cardio label (your #1)
**File**: `src/components/WeightItemsTable.tsx`, lines 586-590
- Hardcoded `mi` in distance display and `mph` in speed calculation
- Also line 674: weight column shows `mi` for distance-only cardio items
- **Fix**: Add `distanceUnit` prop, use `convertDistance`/`convertSpeed` to display in user's preferred unit with correct labels

### 2. ExerciseChart trend toggle labels and data (your #2)
**File**: `src/components/trends/ExerciseChart.tsx`
- The toggle header shows literal `time | mph | distance` text (line ~230)
- Chart bar labels show raw `mph` values and raw `distance_miles` values
- Data computation (lines 93-98) calculates mph/pace in miles only
- **Fix**: Add `distanceUnit` prop, convert all displayed values and labels. Toggle modes become `time | speed | distance` with labels showing `km/h` or `mph` and `km` or `mi` as appropriate

### 3. ExerciseChart tooltip (your #3)
**File**: `src/components/trends/ExerciseChart.tsx`, lines 263-268
- Hardcoded `/mi` for pace, `mph` for speed, `mi in` for distance
- **Fix**: Use the distance unit to show `/km` or `/mi`, `km/h` or `mph`, `km` or `mi`

### 4. CalorieBurnDialog exercise summary (you didn't mention this one)
**File**: `src/components/CalorieBurnDialog.tsx`, line 59
- Shows `X.X mi` hardcoded
- **Fix**: Convert and label based on distance unit

### 5. SaveRoutineDialog exercise summary (you didn't mention this one)
**File**: `src/components/SaveRoutineDialog.tsx`, line 51-53
- Shows `X.X mi` hardcoded when formatting exercise summaries
- **Fix**: Convert and label based on distance unit

### 6. CSV export (minor, probably leave as-is)
**File**: `src/lib/csv-export.ts`, line 125
- Exports `speed_mph` raw value -- this is fine since the column header already says "mph" and CSV should use a canonical unit

Regarding formatting: **km/h** is the internationally recognized standard (used in SI). We already use it in the detail dialog speed toggle, so all new changes will use `km/h` consistently.

## Technical approach

### Props threading
- `ExerciseChart`: add `distanceUnit` prop, passed from `Trends.tsx` via `settings.distanceUnit`
- `WeightItemsTable`: add `distanceUnit` prop, passed from `WeightLog.tsx` via `settings.distanceUnit`
- `CalorieBurnDialog`: already receives `weightUnit`; add `distanceUnit` similarly
- `SaveRoutineDialog`: add `distanceUnit` prop

### Conversion logic
Reuse existing helpers from `src/lib/weight-units.ts`:
- `convertDistance(value, 'mi', distanceUnit)` for distances
- `convertSpeed(value, 'mph', speedUnit)` for speeds
- Pace: `convertDistance(1, 'mi', distanceUnit)` gives the per-unit denominator, then `duration / distanceInPreferredUnit` gives pace in min/preferred-unit

### ExerciseChart specifics
- `CardioViewMode` type stays `'time' | 'mph' | 'distance'` internally (these are mode identifiers, not display labels)
- Display labels in the header subtitle change: `mph` becomes `km/h` when distance unit is km; `distance` label stays as-is
- Bar data computation: convert `distance_miles` to km when needed, compute speed in km/h when needed
- Tooltip: pace shows `/km` or `/mi`, speed shows `km/h` or `mph`, distance shows `km` or `mi`

## Files changed

| File | Change |
|------|--------|
| `src/components/trends/ExerciseChart.tsx` | Add `distanceUnit` prop; convert all displayed distances, speeds, paces |
| `src/pages/Trends.tsx` | Pass `distanceUnit={settings.distanceUnit}` to ExerciseChart |
| `src/components/WeightItemsTable.tsx` | Add `distanceUnit` prop; convert cardio label distances and speeds |
| `src/pages/WeightLog.tsx` | Pass `distanceUnit` to WeightItemsTable instances |
| `src/components/CalorieBurnDialog.tsx` | Add `distanceUnit` prop; convert distance display |
| `src/components/SaveRoutineDialog.tsx` | Add `distanceUnit` prop; convert distance display |

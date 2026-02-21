

# Add Duration and Distance columns to Exercise CSV Export

## What's missing
The exercise log CSV export currently omits two key cardio fields: **duration** (minutes) and **distance** (miles/km). These are stored in the database but never fetched or included in the export.

## Changes

### 1. `src/hooks/useExportData.ts` -- fetch the columns
Add `duration_minutes` and `distance_miles` to the SELECT query and the row mapping.

### 2. `src/lib/csv-export.ts` -- export interface + CSV output
- Add `duration_minutes` and `distance_miles` to the `WeightSetExport` interface.
- Add two new header columns: `Duration (min)` and `Distance (mi)` (plus a `Distance (km)` converted column, matching the existing pattern for weight and speed).
- Map the values into each row.

### Column order
The new columns will be inserted after `Weight (kg)` and before `Incline (%)`, producing:

Date | Time | Exercise | Sets | Reps | Weight (lbs) | Weight (kg) | **Duration (min)** | **Distance (mi)** | **Distance (km)** | Incline (%) | Effort (1-10) | Calories Burned | Heart Rate (bpm) | Cadence (rpm) | Speed (mph) | Speed (km/h) | Raw Input

## Technical details

**`src/hooks/useExportData.ts`**
- Add `duration_minutes, distance_miles` to the `.select(...)` string
- Add to the row mapping: `duration_minutes: row.duration_minutes ?? null`, `distance_miles: row.distance_miles != null ? Number(row.distance_miles) : null`

**`src/lib/csv-export.ts`**
- Add to `WeightSetExport`: `duration_minutes?: number | null` and `distance_miles?: number | null`
- Update `headers` array with the three new columns
- In the row mapping, output `set.duration_minutes ?? ''`, `set.distance_miles ?? ''`, and the km conversion `distance_miles != null ? Number((distance_miles * MI_TO_KM).toFixed(2)) : ''`




# Add heart rate and speed/pace to Apple Health import

## Summary

Two new fields will be extracted from Apple Health workout XML blocks and stored during import: average heart rate and average speed (converted to mph).

## Current state

The import already parses these `WorkoutStatistics` child elements:
- `HKQuantityTypeIdentifierDistanceWalkingRunning` / `DistanceCycling` / `DistanceSwimming` → distance
- `HKQuantityTypeIdentifierActiveEnergyBurned` → calories

It does **not** parse:
- `HKQuantityTypeIdentifierHeartRate` → has an `average` attribute
- `HKQuantityTypeIdentifierRunningSpeed` → has an `average` attribute (in m/s or km/h)

## Changes

| File | Change |
|---|---|
| `src/lib/apple-health-mapping.ts` | Add `parseAverageHeartRate()` — extracts `average` from `HKQuantityTypeIdentifierHeartRate`. Add `parseAverageSpeedMph()` — extracts `average` from `RunningSpeed` or `WalkingSpeed`, converts km/h to mph. Add `heartRate` and `speedMph` to `ParsedWorkout` interface. Update `parseWorkoutBlock()` to call both. |
| `src/components/AppleHealthImport.tsx` | Add `heart_rate: w.heartRate` and `speed_mph: w.speedMph` to the insert row mapping (line ~217). Both columns already exist on `weight_sets`. |

## Technical detail

**New parser functions** in `apple-health-mapping.ts`:

```typescript
export function parseAverageHeartRate(xml: string): number | null {
  const re = /type="HKQuantityTypeIdentifierHeartRate"[^>]*?average="([^"]+)"/i;
  const match = xml.match(re);
  if (!match) return null;
  const hr = parseFloat(match[1]);
  return isNaN(hr) ? null : Math.round(hr);
}

export function parseAverageSpeedMph(xml: string): number | null {
  // Apple exports speed in km/hr for RunningSpeed / WalkingSpeed / CyclingSpeed
  const re = /type="HKQuantityTypeIdentifier(?:RunningSpeed|WalkingSpeed|CyclingSpeed)"[^>]*?average="([^"]+)"/i;
  const match = xml.match(re);
  if (!match) return null;
  const kmh = parseFloat(match[1]);
  if (isNaN(kmh) || kmh <= 0) return null;
  return Math.round(kmh * 0.621371 * 100) / 100;
}
```

**ParsedWorkout** gets two new nullable fields: `heartRate: number | null`, `speedMph: number | null`.

**Insert row** adds: `heart_rate: w.heartRate`, `speed_mph: w.speedMph`.

No database changes needed — both `heart_rate` and `speed_mph` columns already exist on `weight_sets`.


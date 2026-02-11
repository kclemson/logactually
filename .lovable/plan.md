

## Estimated Calorie Burn for Workouts (Revised)

### Overview
Add estimated calorie burn ranges to logged exercises. Always displayed as a range (e.g., "~120-180 cal") and clearly labeled as an estimate. Configuration lives in a focused dialog accessible from Settings, with contextual help explaining what affects accuracy.

### MET Data Source
MET values from the [2024 Compendium of Physical Activities](https://pacompendium.com/) (Arizona State University). Stored in `src/lib/calorie-burn.ts` as a lookup table keyed by `exercise_key` + optional `exercise_subtype`. Exercises not in the table fall back to a generic strength (MET 3.0-6.0) or generic cardio (MET 4.0-8.0) range.

### Intensity Metadata Integration
The system prompt already captures `effort` (1-10), `incline_pct`, and `calories_burned` in `exercise_metadata`. These directly improve estimates:

- **effort**: Interpolates within the MET low-high range (effort 3 = near low, effort 9 = near high)
- **incline_pct**: Adds ~0.5-1.0 MET per 5% incline for treadmill/cycling
- **calories_burned** (user-reported, e.g., from Apple Watch): Bypasses estimation entirely, displayed as "~320 cal (reported)"
- **Default intensity** (user setting): Used when no explicit effort metadata exists, narrows the range for all exercises. Left blank = full MET range used (widest, most honest estimate).

### Settings UI: Entry Point

In the Preferences section of Settings, a single row that acts as a button to open the dialog:

```text
When feature is off:
  Calorie Burn Estimates        [Set up]

When feature is on:
  Calorie Burn Estimates        [160 lbs, moderate ...]  (tap to edit)
```

Tapping the row or button opens the Calorie Burn Estimates dialog. No toggle on the settings page itself.

### Settings UI: Configuration Dialog

A focused dialog (`CalorieBurnDialog`) with the enable toggle and all configuration inside:

```text
Calorie Burn Estimates
Estimate how many calories each workout burns, shown as a range.

[Toggle] Show calorie burn estimates

--- Your info (narrows the range) ---

Body weight:       [___] lbs / kg       "Biggest factor (~2-3x impact)"
Height:            [___] in / cm         "Used for metabolic rate calculation"
Age:               [___]                 "Metabolic rate decreases ~5% per decade"

Calorie estimates   [ Female body composition ]
based on:           [ Male body composition   ]
                    [ Population average       ]    <-- default
                    "Affects estimates by ~5-10%"

--- Workout defaults ---

Default intensity:  [___] /10
  "Used when you don't log effort level. Leave blank to show the full range."

--- What affects your estimates ---

The biggest factors are your body weight and exercise intensity.
Include details like "hard effort", "8/10 intensity", or "12% incline"
when logging workouts to get narrower ranges. If your device reports
calories burned (e.g. Apple Watch), mention it and we'll use that
number directly.
```

Height unit respects a new `heightUnit` setting ('in' or 'cm'), togglable inline similar to weight units. Stored internally as inches.

### User Settings Changes

Add to `UserSettings` interface in `src/hooks/useUserSettings.ts`:
- `calorieBurnEnabled: boolean` (default: `false`)
- `bodyWeightLbs: number | null` (default: `null`)
- `heightInches: number | null` (default: `null`)
- `heightUnit: 'in' | 'cm'` (default: `'in'`)
- `age: number | null` (default: `null`)
- `bodyComposition: 'female' | 'male' | null` (default: `null` = population average)
- `defaultIntensity: number | null` (default: `null`, 1-10 scale)

### Estimation Logic

New file `src/lib/calorie-burn.ts`:

1. MET lookup table keyed by `exercise_key` + optional subtype
2. Main function: `estimateCalorieBurn(exercise, userSettings)` returns `{ low: number, high: number }` or `{ exact: number }` when user-reported
3. For cardio: uses actual `duration_minutes`
4. For strength: estimates duration from sets x reps (~35-45 sec per set including rest)
5. Intensity narrowing: effort metadata or `defaultIntensity` interpolates within MET range
6. Incline adjustment: adds MET bonus for incline metadata
7. Weight: uses `bodyWeightLbs` if set, otherwise 130-190 lb range (widens output)
8. Composition multiplier: female = 0.95, male = 1.05, null/average = 1.0
9. BMR-aware adjustment when height + age + weight are all provided (Mifflin-St Jeor)

### MET Reference Values

```text
Exercise Key        | Subtype    | MET Low | MET High
--------------------|------------|---------|----------
walk_run            | walking    |   2.0   |   3.5
walk_run            | running    |   8.0   |  12.0
walk_run            | hiking     |   5.0   |   8.0
cycling             | indoor     |   4.0   |   8.5
cycling             | outdoor    |   4.0   |  10.0
swimming            | pool       |   6.0   |  10.0
swimming            | open_water |   6.0   |  10.0
rowing              | --         |   4.0   |   8.0
elliptical          | --         |   5.0   |   8.0
stair_climber       | --         |   6.0   |   9.0
jump_rope           | --         |   8.0   |  12.0
bench_press         | --         |   3.5   |   5.0
squat               | --         |   5.0   |   6.0
deadlift            | --         |   5.0   |   6.0
(generic strength)  | --         |   3.0   |   6.0
(generic cardio)    | --         |   4.0   |   8.0
```

### UI Display

**Per-exercise** (in `WeightItemsTable.tsx`): subtle muted text below each exercise
- Range: `"~120-180 cal est."`
- Reported: `"~320 cal (reported)"`
- Only shown when `calorieBurnEnabled` is true

**Daily total** (in `WeightLog.tsx`): summary when exercises exist for the day
- `"Est. burn: ~450-680 cal"`

### Test Automation

New file `src/lib/calorie-burn.test.ts` with comprehensive test matrix covering:

- **Cardio with full metadata**: walk_run/running, 30 min, effort 8, 160 lbs, male -- expect narrow range
- **Cardio without metadata**: cycling, 45 min, no effort/weight -- expect wide range using population defaults
- **Strength exercises**: bench_press 3x10@135, with and without body weight
- **User-reported calories**: exercise with `calories_burned` in metadata -- expect exact value passthrough
- **Default intensity**: same exercise with and without default intensity setting
- **Incline adjustment**: treadmill walk with 10% incline vs no incline
- **Body composition impact**: same exercise, female vs male vs average -- verify ~5-10% difference
- **Missing duration for cardio**: verify fallback duration estimation
- **Unknown exercise key**: verify generic fallback MET is used
- **Edge cases**: 0 sets, 0 reps, 0 duration, very high weight, very low weight
- **Height unit conversion**: cm to inches storage
- **Weight unit conversion**: kg input stored as lbs

### Files Changed

1. `src/lib/calorie-burn.ts` -- new: MET table, intensity integration, estimation functions, BMR helper
2. `src/lib/calorie-burn.test.ts` -- new: comprehensive test suite
3. `src/hooks/useUserSettings.ts` -- add calorie burn settings fields with defaults
4. `src/components/CalorieBurnDialog.tsx` -- new: configuration dialog with inline help
5. `src/pages/Settings.tsx` -- add entry point row in Preferences section
6. `src/components/WeightItemsTable.tsx` -- per-exercise burn display (when enabled)
7. `src/pages/WeightLog.tsx` -- daily burn summary (when enabled)

### Not Included (future considerations)
- Subtract exercise burn from daily calorie target visualization
- Burn estimates on History/calendar or Trends pages
- Net calorie balance (food intake minus exercise burn)
- TDEE calculator


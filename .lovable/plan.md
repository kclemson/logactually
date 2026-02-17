

# Add cardio and casual activities to demo data

## Proposed activities and frequency ratios

### Cardio exercises

| Activity | Key | Duration range | Distance | Example inputs |
|----------|-----|---------------|----------|----------------|
| Morning walk | `walk_run` (walking) | **15-20 min** | 0.7-1.2 mi | "walked 15 min", "morning walk, about a mile" |
| Run | `walk_run` (running) | 20-35 min | 2-4 mi | "ran 3 miles 28 min" |
| Bike ride | `cycling` (outdoor) | 25-45 min | 5-12 mi | "bike ride 8 miles 35 min" |
| Stationary bike | `cycling` (indoor) | 15-30 min | -- | "spin bike 25 min" |
| Elliptical | `elliptical` | 20-35 min | -- | "elliptical 30 min" |
| Swimming | `swimming` | 20-40 min | -- | "swam laps 30 min" |
| Rowing machine | `rowing` | 15-25 min | -- | "rower 20 min" |
| Stairmaster | `stair_climber` | 15-25 min | -- | "stairmaster 20 min" |

### Casual / everyday activities

| Activity | Key | Duration range | Example inputs |
|----------|-----|---------------|----------------|
| Gardening | `functional_strength` | 30-60 min | "gardening 45 min" |
| Yard work | `functional_strength` | 30-75 min | "yard work mowing and raking 1 hr" |
| House cleaning | `functional_strength` | 30-90 min | "deep cleaned the house 90 min" |
| Hiking | `walk_run` (hiking) | 60-120 min | "hiked 4 miles, about 1.5 hours" |
| Playing with kids | `functional_strength` | 30-60 min | "played outside with kids 45 min" |

### Frequency ratios (per day, independent decisions)

| Activity type | Chance per day | Effective frequency |
|--------------|----------------|---------------------|
| Strength training (existing) | 50% | ~3.5 days/week |
| Cardio session (1-2 exercises) | 40% | ~2.8 days/week |
| Casual activity (1 activity) | 12% | ~0.8 days/week |

Some days will have both strength + cardio (realistic "cardio warmup then lift" pattern). Most cardio-only days will have 1 exercise; ~30% will pair two (e.g., walk + elliptical).

## Technical changes

### File: `supabase/functions/populate-demo-data/index.ts`

1. **Add `CARDIO_EXERCISES` constant** after existing `EXERCISES` -- array of activity definitions with key, subtype, duration range, optional distance range, and input templates.

2. **Add `CASUAL_ACTIVITIES` constant** -- array of everyday activities with key, subtype, duration range, input templates.

3. **Add `generateCardioEntry()` function** -- picks a random cardio/casual activity, generates duration/distance within range, builds a natural-language `raw_input`, returns a weight_set-shaped object with `sets: 0, reps: 0, weight_lbs: 0, duration_minutes, distance_miles`.

4. **Update the day loop (line ~890)** -- after the existing strength block, add:
   - 40% chance: generate 1-2 cardio exercises as separate weight_set rows (own entry_id)
   - 12% chance: generate 1 casual activity as a weight_set row

5. **Update `SAVED_ROUTINE_TEMPLATES`** -- add 1-2 templates that include cardio, e.g. "Cardio Day" with `walk_run` + `elliptical`.

6. **Update `GeneratedExercise` interface** -- add optional `duration_minutes`, `distance_miles`, `exercise_subtype` fields so cardio entries can carry that data into the insert.



## Add Distance Extraction + Consolidate Cardio Keys

### Problem

1. When you log "1.5 mile run in 12 min", the AI ignores the distance - it stays null in the database
2. Cardio exercise keys are fragmented: `treadmill`, `walking`, `running`, `stationary_bike` all create separate Trends charts when users often care about the same underlying activity
3. Prompt has redundant `sets: 0, reps: 0, weight_lbs: 0` instructions for cardio

### Solution

1. Consolidate locomotion into `walk_run` key (treadmill walk/jog/run, outdoor walk/run, speedwalk, etc.)
2. Consolidate cycling into `cycling` key (stationary bike, outdoor cycling, spin)
3. Add `distance_miles` extraction
4. Clean up redundant cardio prompt instructions

---

### New Cardio Key Structure

| Old Keys | New Key | Description Field (AI-inferred) |
|----------|---------|--------------------------------|
| `treadmill`, `walking`, `running` | `walk_run` | "Treadmill Walk", "Morning Jog", "5K Run", etc. |
| `stationary_bike` | `cycling` | "Stationary Bike", "Spin Class", "Outdoor Ride", etc. |
| `elliptical` | `elliptical` | (unchanged) |
| `rowing_machine` | `rowing` | (simplified key name) |
| `stair_climber` | `stair_climber` | (unchanged) |
| `swimming` | `swimming` | (unchanged) |
| `jump_rope` | `jump_rope` | (unchanged) |

---

### File Changes

#### 1. `supabase/functions/_shared/exercises.ts`

**Replace lines 97-106 (Cardio section):**

```typescript
// Cardio / Duration-Based
{ key: 'walk_run', name: 'Walk/Run', aliases: ['treadmill', 'treadmill walk', 'treadmill run', 'treadmill jog', 'walking', 'walk', 'running', 'run', 'jog', 'jogging', 'speedwalk', 'outdoor walk', 'outdoor run', 'incline walk'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'cycling', name: 'Cycling', aliases: ['bike', 'stationary bike', 'spin bike', 'spin class', 'exercise bike', 'recumbent bike', 'outdoor bike', 'bicycle'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'elliptical', name: 'Elliptical', aliases: ['elliptical machine', 'cross trainer'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'rowing', name: 'Rowing', aliases: ['rowing machine', 'row machine', 'erg', 'rower', 'concept 2', 'ergometer'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'stair_climber', name: 'Stair Climber', aliases: ['stairmaster', 'stair stepper', 'step machine'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'swimming', name: 'Swimming', aliases: ['swim', 'laps', 'pool'], primaryMuscle: 'Cardio', isCardio: true },
{ key: 'jump_rope', name: 'Jump Rope', aliases: ['skipping', 'skip rope'], primaryMuscle: 'Cardio', isCardio: true },
```

---

#### 2. `src/lib/exercise-metadata.ts`

**Replace lines 71-81 (Cardio section):**

```typescript
// Cardio / Duration-Based
walk_run: { primary: 'Cardio', isCardio: true },
cycling: { primary: 'Cardio', isCardio: true },
elliptical: { primary: 'Cardio', isCardio: true },
rowing: { primary: 'Cardio', isCardio: true },
stair_climber: { primary: 'Cardio', isCardio: true },
swimming: { primary: 'Cardio', isCardio: true },
jump_rope: { primary: 'Cardio', isCardio: true },
```

---

#### 3. `supabase/functions/analyze-weights/index.ts`

**Prompt changes (lines 39-46):**

Current:
```
For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly name (e.g., "Treadmill Walk", "Stationary Bike")
- duration_minutes: duration in minutes (integer)
- sets: 0
- reps: 0
- weight_lbs: 0
```

New:
```
For cardio or duration-based exercises, provide:
- exercise_key: a canonical snake_case identifier from the reference below
- description: a user-friendly, context-specific name (e.g., "Treadmill Jog", "Morning Walk", "5K Run", "Spin Class")
- duration_minutes: duration in minutes (integer), if relevant
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).
```

**Example JSON changes (line 56):**

Current:
```json
{ "exercise_key": "treadmill", "description": "Treadmill Walk", "duration_minutes": 30, "sets": 0, "reps": 0, "weight_lbs": 0 }
```

New:
```json
{ "exercise_key": "walk_run", "description": "Treadmill Walk", "duration_minutes": 30 },
{ "exercise_key": "walk_run", "description": "5K Run", "duration_minutes": 25, "distance_miles": 3.1 }
```

**Normalization logic (lines 198-220):**

Add after line 202:
```typescript
const distance_miles = Number(exercise.distance_miles) || 0;
```

Modify line 206:
```typescript
const hasCardioData = duration_minutes > 0 || distance_miles > 0;
```

Add to normalized object:
```typescript
distance_miles: hasCardioData && distance_miles > 0 
  ? Math.round(distance_miles * 100) / 100
  : null,
```

---

#### 4. `src/types/weight.ts`

**Add to `AnalyzedExercise` (after line 70):**
```typescript
distance_miles?: number | null;
```

**Add to `SavedExerciseSet` (after line 82):**
```typescript
distance_miles?: number | null;
```

---

### Example Inputs After Changes

| User Input | exercise_key | description | duration | distance |
|------------|--------------|-------------|----------|----------|
| `treadmill 30 min` | `walk_run` | "Treadmill Walk" | 30 | null |
| `treadmill jog 20min 2mi` | `walk_run` | "Treadmill Jog" | 20 | 2.0 |
| `3 mile walk` | `walk_run` | "Walking" | null | 3.0 |
| `5k run` | `walk_run` | "5K Run" | null | 3.1 |
| `morning run 30 min` | `walk_run` | "Morning Run" | 30 | null |
| `spin class 45 min` | `cycling` | "Spin Class" | 45 | null |
| `outdoor bike 10 miles` | `cycling` | "Outdoor Ride" | null | 10.0 |
| `elliptical 20 min` | `elliptical` | "Elliptical" | 20 | null |

---

### Data Migration Note

Existing data with old keys (`treadmill`, `running`, `walking`, `stationary_bike`, `rowing_machine`) will remain in the database. Options:

1. **Do nothing** - old entries keep old keys, new entries use new keys. Trends will show separate charts for historical data until merged manually.

2. **Run migration** (recommended) - update existing records to use the new consolidated keys:

```sql
UPDATE weight_sets SET exercise_key = 'walk_run' WHERE exercise_key IN ('treadmill', 'walking', 'running');
UPDATE weight_sets SET exercise_key = 'cycling' WHERE exercise_key = 'stationary_bike';
UPDATE weight_sets SET exercise_key = 'rowing' WHERE exercise_key = 'rowing_machine';
```

---

### Files Modified

| File | Changes |
|------|---------|
| `supabase/functions/_shared/exercises.ts` | Consolidate cardio keys (treadmill/walking/running → walk_run, etc.) |
| `src/lib/exercise-metadata.ts` | Mirror the consolidated cardio keys |
| `supabase/functions/analyze-weights/index.ts` | Update prompt + add distance_miles extraction |
| `src/types/weight.ts` | Add distance_miles to AnalyzedExercise and SavedExerciseSet |


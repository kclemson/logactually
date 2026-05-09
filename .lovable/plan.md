# Richer Demo Routines & Exercise Variety

Make the demo account's saved routines and daily exercise data look like a real, varied user — closer to your own usage — so changelog screenshots feel authentic. All changes live in `supabase/functions/populate-demo-data/index.ts`.

## What's wrong today

- `SAVED_ROUTINE_TEMPLATES` (line 416) is 8 fat day-blocks ("Upper Body Day", "Leg Day"). Real users mostly save tiny single-movement routines like "Leg Press", "Lat Pulldown", "Dog walk (25m, 1mi)".
- `original_input` is just `exercises.join(', ')` — sterile.
- `EXERCISES` pool (~16 movements) is missing common ones: dips, pull-ups, tricep extension, calf raise, hip abduction, crunch, RDL variants, face pull, lateral raise (was free-weight only), diverging low row.
- `generateWeightEntriesForDay` never references a saved routine, so `source_routine_id` is always null — feature looks unused in screenshots, Trends "by routine" stays empty.

## What changes

### 1. Expand the exercise pool (`EXERCISES`)

Add ~10 movements your real account uses, distributed across categories:
- **machine**: `tricep_extension`, `seated_calf_raise`, `hip_abduction`, `diverging_low_row`, `crunch` (machine variant)
- **compound**: keep as-is, plus `pull_up` (with description "Chin ups" sometimes), `dips`
- **freeWeight**: `face_pull`, `tricep_kickback`, `rdl_dumbbell`

Each gets `startWeight` / `maxProgress` tuned to your patterns (e.g., calf raise 180→220, hip abduction 90→150, tricep ext 65→90).

### 2. Replace `SAVED_ROUTINE_TEMPLATES` with a shape-mix generator

Instead of one flat array, define three tiers and sample by weighted probability:

```text
~70%  single-exercise   → name = exercise name; one set spec
~20%  mini (2-3 ex)     → name = themed ("Pull mini", "Quick legs")
~10%  full day          → name = day-block (current style, kept)
```

For each routine:
- Pick exercise(s) from expanded `EXERCISES` (and occasionally `CARDIO_EXERCISES` for cardio routines like "Dog walk (25m, 1mi)").
- Pick a `(sets, reps)` pattern from a varied list: 3x8, 3x10, 3x12, 3x16, 4x8, 1x10+2x8 (mixed), occasionally 5x5.
- Generate a casual `original_input` with `generateCasualExerciseInput` (already exists, line ~624) — produces phrasings like "leg press 3x10x180", "Hamstring curl 3x8x60", "3 sets of 10 at 65 lat pulldown". For ~25% of single-exercise routines, use a "messy human" template ("3 groups of 10 times on lat pulldown, weight was 65lbs i think").
- Cardio single-routines: name baked with params, e.g. `Dog walk (${dur}m, ${dist}mi)`.
- `is_auto_named`: true for ~60% (single-exercise auto-names), false for the rest (named day blocks, cardio with params).
- `use_count`: weight by shape — singles 5–25, minis 3–10, days 2–6.

### 3. Wire daily logs to saved routines (~30%)

After saved routines are inserted, **return their IDs back into the day loop** (refactor: generate + insert routines *before* the day loop, or pass IDs to a post-pass).

In `generateWeightEntriesForDay`:
- 30% of workout days: pick a random saved routine, expand its `exercise_sets` into the day's exercises (with the day's progression applied to weights), set `rawInput` to a slight variant of the routine's `original_input`, and pass the routine's id back so the insert can set `source_routine_id` and bump `last_used_at`.
- 70% of workout days: current free random-pick behavior (still gives variety).

When a routine is used, also do a final `UPDATE saved_routines SET use_count = use_count + N, last_used_at = max(...)` per routine at the end (or accumulate during the loop and one update per routine at end).

### 4. Vary daily-log sets/reps & phrasing

In `generateWeightEntriesForDay`:
- Replace the single `calculateSetsReps` output with a small library of patterns (3x8, 3x10, 3x12, 4x6, 5x5) chosen randomly, biased toward 3x8–3x12.
- Occasionally (15%) emit a "mixed-set" line like "3x10x65, 2x8x70" by calling `generateCasualExerciseInput` twice and joining.

### 5. Verification

After deploy, re-run populate-demo-data for a 30-day range with `clearExisting: true`, then query:
- `SELECT name, is_auto_named, use_count FROM saved_routines WHERE user_id = <demo>` — confirm shape mix.
- `SELECT count(*) FILTER (WHERE source_routine_id IS NOT NULL), count(*) FROM weight_sets WHERE user_id = <demo>` — confirm ~30% linked.
- Sign in as demo and screenshot Saved Routines list + a daily Exercise log to confirm visual variety.

## Out of scope

- Changing food population, custom logs, or biometrics.
- Changing the `EXERCISES` schema in the rest of the app (`_shared/exercises.ts`) — the populator will only use `exercise_key` strings already accepted by the system; if any new key isn't recognized, fall back to a known one or add it to the populator only.
- UI changes in the dialog.

# Populate demo data exercise group names

## Current state
The recent change to `WeightLog.tsx` now derives the group header for multi-exercise entries with this priority:
1. Saved routine name (if `source_routine_id` is set)
2. AI `summary` (from `analyze-weights`)
3. First exercise description

It no longer falls back to the raw typed sentence.

`populate-demo-data` inserts weight rows directly into `weight_sets`. It sets `raw_input` and `source_routine_id`, but it does **not** set `group_name`. That means:
- Demo entries created from a saved routine will look clean (routine name wins).
- Demo entries created by `generateWeightEntriesForDay` (random multi-exercise days) still expose the messy `raw_input` string as the header, because there is no routine and no summary.

## Goal
Make demo-generated exercise groups show clean, short headers instead of raw sentences, mirroring the new real-user behavior.

## Changes
1. In `supabase/functions/populate-demo-data/index.ts`, when inserting `weight_sets` for a generated routine:
   - If `sourceRoutineId` is set, set `group_name` to `routine.name`.
   - If no routine is set and there are 2+ exercises, derive a short `group_name` from the generated exercises (e.g. combine muscle-group hints or fall back to "Strength Workout").
   - For single-exercise entries, leave `group_name` null so the UI falls back to the exercise description.
2. Keep `raw_input` unchanged (it is still useful as the original human-style input).
3. No DB schema changes; `group_name` is already stored on `weight_sets`.

## Outcome
Re-running "Populate Demo Data" produces weight log groups with short, readable headers like "Leg Day" or "Strength Workout" instead of long raw strings.

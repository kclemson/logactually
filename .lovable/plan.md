# Making exercise keys consistent

## What the data actually shows

Querying your logged sets confirms the drift is real and it is a naming problem, not a one-off:

| What you typed | Key it got | Rows |
|---|---|---|
| "chest press" | `chest_press_machine` | 43 |
| "chest press" | `bench_press` | 36 |
| "bench press" | `bench_press` | 48 |
| "bench press" | `chest_press_machine` | 3 |
| "reclined arm press" | `chest_press_machine` | 18 |
| "reclined arm press" | `bench_press` | 2 |

The exact same phrase lands on two different keys depending on the run. Same pattern elsewhere: `back_extension` (20) vs `back_extensions` (5), `bicep_curl` absorbing "preacher curl" (19 rows) while `preacher_curl` exists as its own key.

Root cause: the exercise key is chosen entirely by the AI at write time, from free text, with no deterministic step afterward. Nothing snaps "chest press" to one key, and nothing prevents a plural or typo from minting a new key.

## The approach

Three layers, cheapest first. Each is independently useful.

### 1. Deterministic key resolution after the AI call

Add a resolver that runs on the AI's output before the row is written. It takes the model's proposed `exercise_key` plus the raw description and snaps it to a canonical key using the alias table that already exists in `CANONICAL_EXERCISES`.

Rules, in order:
- Normalize the proposed key: lowercase, singularize trailing `s`, collapse separators. This alone kills `back_extensions`, `farmers_carries`, and typo keys.
- Exact key match against the catalog wins.
- Alias match against the catalog (checking the description text too) wins next.
- No match: keep the model's key as a new one, which is the current behavior and the thing that lets genuine new exercises through.

This makes key assignment reproducible: the same text always produces the same key, regardless of model mood.

### 2. Equipment as an explicit dimension

The ambiguity in "chest press" is not really about the exercise, it is about the equipment. Today equipment is baked into the key name (`chest_press_machine` vs `dumbbell_press` vs `bench_press`), which forces the model to guess an equipment word that you never said.

Store equipment in the existing `exercise_subtype` column instead — no migration needed, it is already nullable text and already carries variants for cardio. Values: `machine`, `barbell`, `dumbbell`, `cable`, `kettlebell`, `bodyweight`, `smith`.

Then:
- `chest_press` becomes one movement key, with equipment as the splitter.
- The prompt asks for equipment only when it is stated or clearly implied, and leaves it null otherwise, rather than forcing a key-level guess.
- The trends chart already splits by subtype for `walk_run`. Generalize that: split a movement into separate charts when the subtypes each clear the existing session threshold, otherwise show one combined chart.

### 3. One-time backfill of your history

With the resolver written, run it over your existing `weight_sets` rows to produce a proposed mapping, review the list before anything is written, then apply. The two-key "chest press" split and the singular/plural pairs get collapsed. Any pin or saved chart pointing at a retired key gets re-pointed in the same pass — the earlier bloodwork backfill left a stale pin behind, so this is a real failure mode to cover.

## Scope note

You already have merge tooling: `useMergeExercises` plus the `DuplicateExercisePrompt` card on the trends page, which detects same-description duplicates and offers a one-tap merge. That handles cleanup after the fact but does nothing to stop new drift, which is why the resolver comes first.

## Technical detail

- New `src/lib/exercise-resolve.ts` with `resolveExerciseKey(proposedKey, description)`, plus a mirror under `supabase/functions/_shared/`. Unit tests covering the cases in the table above.
- `supabase/functions/analyze-weights/index.ts` calls the resolver on each returned set before responding.
- `supabase/functions/_shared/prompts.ts`: movement key and equipment become separate asks; drop the pressure to encode equipment in the key.
- `src/lib/exercise-metadata.ts` and `supabase/functions/_shared/exercises.ts`: add an `equipment` field to catalog entries, keep retired keys as aliases so old data and typeahead still resolve.
- `src/hooks/useWeightTrends.ts`: replace the hardcoded `exerciseKey === 'walk_run'` split with a general subtype-split rule.
- `src/components/trends/ExerciseChart.tsx`: title stays `{Movement} — {Subtype}`, now covering equipment.
- Backfill runs through the insert tool after you approve the mapping list.

## Suggested order

Start with layer 1 alone. It stops new drift and is low risk. Layer 2 is the larger change and is worth doing only if you want machine vs dumbbell to be a thing you can filter and chart on, rather than just a naming detail. Layer 3 comes last either way, since the backfill should use the final resolver.

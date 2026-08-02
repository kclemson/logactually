# Cleaner group titles for multi-exercise workout logs

## What's happening

Food and exercise logging differ in how the group header for a multi-item entry is named:

- **Food:** the AI returns a short `summary` ("Chicken salad") alongside the parsed items, and that becomes the group label. Raw text is only a fallback.
- **Exercise:** the AI returns only the exercise list — no summary. So the group label falls back to the entire raw typed input, e.g. "squats 65 3x12, legpress 5x5 90lbs, leg ext 45 3x10, leg curls 3sets 10reps 30," which wraps over multiple lines and looks messy.

Saved routines already give a clean name ("Leg Day"); only free-text entries are affected.

## The fix

Give exercise parsing the same short-label capability food already has.

1. Add a `summary` field to both weights prompts: a short 2-4 word workout label, only when 2+ exercises (e.g. "Leg Day", "Push Session", "Cardio + Core"). Written as general guidance, not phrase mappings.
2. Pass `summary` through the analyze-weights response and the analyze hook.
3. In the exercise log, set the group name priority to: saved routine name > AI summary > first exercise description. Raw input is dropped as a label source (still stored as `raw_input`, still shown in the expanded row).
4. Safety net for missing/oversized summaries: if the resulting label is longer than ~40 chars, fall back to the first exercise description rather than dumping raw text into the header.

Existing entries keep their current label; they can be renamed inline as today.

## Technical notes

- `supabase/functions/_shared/prompts.ts` — add `summary` to `ANALYZE_WEIGHTS_PROMPT_DEFAULT` and `..._EXPERIMENTAL` response format blocks.
- `supabase/functions/analyze-weights/index.ts` — include `summary` in the JSON response when present.
- `src/hooks/useAnalyzeWeights.ts` — add `summary?: string` to `AnalyzeWeightsResult`.
- `src/pages/WeightLog.tsx` — `createEntryFromExercises` accepts an optional `summary` and applies the new priority order; caller in the free-text submit path passes `result.summary`.

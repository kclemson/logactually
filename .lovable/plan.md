

## Add `exercise_metadata` Support (DB + Client + Experimental Prompt)

### Overview

Two parallel tracks:
1. **Ship now:** Database column, types, data persistence, and CSV export -- these are safe, no behavior change for users until the AI actually returns metadata.
2. **Experimental only:** Move the weights prompt into `_shared/prompts.ts` with default/experimental versioning (matching the food pattern), and add the `exercise_metadata` extraction instructions only to the experimental prompt. This lets you test via the DevTools prompt eval panel before promoting to production.

### Your question about multi-field examples

Good instinct. Yes -- the response format example should show an `exercise_metadata` object with more than one field so the AI learns the structure. The example will be:

```json
{ "exercise_key": "walk_run", "exercise_subtype": "running", "description": "Hard Treadmill Run", "duration_minutes": 20, "distance_miles": 2.1, "exercise_metadata": { "incline_pct": 5, "effort": 8, "calories_burned": 320 } }
```

This shows all three fields together so the AI sees how to combine them.

---

### 1. Database migration

```sql
ALTER TABLE public.weight_sets ADD COLUMN exercise_metadata jsonb DEFAULT NULL;
```

### 2. Type updates (`src/types/weight.ts`)

Add `exercise_metadata?: Record<string, number> | null` to `WeightSet`, `WeightSetRow`, `AnalyzedExercise`, and `SavedExerciseSet`.

### 3. Data persistence (`src/hooks/useWeightEntries.ts`)

- Read: map `row.exercise_metadata` through on fetch
- Write: include `exercise_metadata` in insert rows

### 4. Analyze hook (`src/hooks/useAnalyzeWeights.ts`)

Pass `exercise_metadata` through from the edge function response (it will be null/undefined from the default prompt, populated from experimental).

### 5. CSV export (`src/lib/csv-export.ts` + `src/hooks/useExportData.ts`)

- Add `exercise_metadata` to `WeightSetExport` interface
- Add three CSV columns: `Incline (%)`, `Effort (1-10)`, `Calories Burned`
- Fetch `exercise_metadata` in the export query

### 6. Move weights prompt to `_shared/prompts.ts`

Extract the inline `ANALYZE_WEIGHTS_PROMPT` from `analyze-weights/index.ts` into `_shared/prompts.ts` as two versions:

- `ANALYZE_WEIGHTS_PROMPT_DEFAULT` -- identical to today's prompt (no behavior change)
- `ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL` -- adds the exercise metadata section and multi-field example

Add a `getAnalyzeWeightsPrompt(version)` function matching the existing `getAnalyzeFoodPrompt(version)` pattern.

### 7. Update `analyze-weights/index.ts`

- Import `getAnalyzeWeightsPrompt` and `PromptVersion` from `_shared/prompts.ts`
- Accept `promptVersion` from request body (same as analyze-food does)
- Select prompt based on version
- Add metadata sanitization in the normalizer (allowlist: `incline_pct`, `effort`, `calories_burned`; coerce to numbers; clamp effort to 1-10)
- Include `exercise_metadata` in the normalized output

### 8. Experimental prompt additions (exact text)

Added between the cardio section and response format section:

```text
## EXERCISE METADATA (optional)

If the user explicitly mentions any of the following, include an "exercise_metadata" object on that exercise. Only include fields that are clearly stated or strongly implied. Omit the entire object if none apply.

- incline_pct: treadmill or machine incline as a number (e.g., "5% incline" -> 5, "incline 12" -> 12)
- effort: perceived effort on a 1-10 scale. Map natural language to this scale:
  - 1-2: recovery, very easy, barely trying
  - 3-4: easy, light, comfortable
  - 5-6: moderate, steady, medium effort
  - 7-8: hard, challenging, tough, difficult
  - 9-10: all-out, maximum effort, brutal, hardest ever
  - If the user gives a numeric rating (e.g., "8/10 difficulty"), use that number directly
- calories_burned: calories the user says they burned (e.g., "burned 350 cal" -> 350)
```

Updated response format example:

```json
{
  "exercises": [
    { "exercise_key": "bench_press", "description": "Bench Press", "sets": 3, "reps": 10, "weight_lbs": 135 },
    { "exercise_key": "walk_run", "exercise_subtype": "running", "description": "Hard Treadmill Run", "duration_minutes": 20, "distance_miles": 2.1, "exercise_metadata": { "incline_pct": 5, "effort": 8, "calories_burned": 320 } },
    { "exercise_key": "walk_run", "description": "Treadmill Walk", "duration_minutes": 30 }
  ]
}
```

Note: one exercise has all three metadata fields, one has none -- this teaches the AI both patterns.

### What does NOT change

- Default prompt behavior (production users see zero change)
- WeightItemsTable UI
- Trends/charts
- Saved routines

### Testing flow

After deploying, go to the Admin page, switch test type to "weights" and prompt version to "experimental", then run test cases like:
- "really hard treadmill run at 5% incline for 20 min"
- "easy walk 30 minutes"
- "bench press 3x10 135 medium effort"
- "burned 400 calories on elliptical 30 min"
- "8/10 difficulty cycling 45 min"

Once you're happy with the results, we promote the experimental prompt to default.

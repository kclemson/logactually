

## Inject exercise reference list into chart DSL prompt + add subtype filter

### Problem

The previous plan suggested hardcoding a mapping table of common terms (e.g., "running" maps to `walk_run`). But the canonical exercise list already exists in `_shared/exercises.ts` with keys, aliases, and `isCardio` flags. The AI is smart enough to figure out the mapping if we just give it the list. Similarly, subtype data already exists in the database -- we just need to tell the AI about the hierarchy and let it use `exerciseSubtype` in filters.

### Approach

1. Import and inject the canonical exercise list into the generate-chart-dsl prompt (same pattern used by `analyze-weights`)
2. Add `exerciseSubtype` to the DSL filter schema
3. Add `exercise_subtype` to the query select and apply it as a filter
4. Let the AI handle all the mapping logic -- no hardcoded term tables

### Changes

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | Import `getWeightExerciseReferenceForPrompt` and `getCardioExerciseReferenceForPrompt` from `_shared/exercises.ts`. Inject them into the system prompt under a new "CANONICAL EXERCISES" section. Add `exerciseSubtype` to the filter schema. Add guidance explaining the key/subtype hierarchy (e.g., `walk_run` is the key, `running`/`walking`/`hiking` are subtypes). |
| `src/lib/chart-types.ts` | Add `exerciseSubtype?: string` to the filter interface. |
| `src/lib/chart-data.ts` | Add `exercise_subtype` to the select columns. Accept `exerciseSubtype` filter param. When set, add `.eq("exercise_subtype", value)` to the query. |

### What the prompt will look like

The existing exercise reference helpers produce output like:
```
- bench_press: "Bench Press" [Chest + Triceps] (also: flat bench, barbell bench, ...)
- walk_run: "Walk/Run" (also: treadmill, running, walking, jogging, ...)
```

We add a section explaining the hierarchy:
```
CANONICAL EXERCISES:
Some exercises share a key with subtypes. For example, "walk_run" covers
walking, running, and hiking. When the user asks about a specific activity
like "running", use filter.exerciseKey="walk_run" + filter.exerciseSubtype="running".

Known subtypes in user data: walk_run (walking, running, hiking),
cycling (indoor, outdoor).

Strength exercises:
  [injected list]

Cardio exercises:
  [injected list]
```

### What does NOT change

- No new mapping tables or constants
- No changes to `_shared/exercises.ts`
- No changes to `chart-dsl.ts` (filter applied at data layer)

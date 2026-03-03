

## Add exercise filter to Compare Chart Builder

The ChartDSL already supports `filter.exerciseKey` and `filter.exerciseSubtype`, and `fetchChartData` already applies these filters to queries. The compare builder simply doesn't expose them in the UI.

### Approach: conditional exercise picker per series

When a series has `source === "exercise"`, show an optional "Exercise" dropdown that lets the user scope to a specific exercise (e.g., walk_run) and an optional "Subtype" dropdown (e.g., walking, running). When left on "All", no filter is applied — same as today.

### Changes

**`src/components/CompareChartBuilder.tsx`**:

1. Expand `SeriesConfig` to include optional `exerciseKey?: string` and `exerciseSubtype?: string`.

2. In `SeriesRow`, when `config.source === "exercise"`, render an additional "Exercise" select after the metric picker. Options: "All" (no filter) plus the list of known exercise keys from `EXERCISE_KEYS` (imported from `exercise-metadata.ts`). When an exercise with subtypes is selected (e.g., `walk_run`), show a second "Subtype" select with options like "All", "walking", "running", "hiking".

3. In `handleGenerate`, pass the filter into the built DSL:
   ```ts
   filter: s.exerciseKey ? { exerciseKey: s.exerciseKey, exerciseSubtype: s.exerciseSubtype } : undefined
   ```

4. Update the auto-generated title to include the exercise/subtype name when filtered (e.g., "Heart rate (walking) vs Heart rate (running)").

5. When source changes away from "exercise", clear `exerciseKey` and `exerciseSubtype`.

**Data source for exercise list**: Import the canonical exercise registry from `exercise-metadata.ts` to populate the dropdown. Need to check what's exported there.

### What this enables

- Case #2: HR on walks vs HR on runs — Series A: exercise / heart_rate / filter walk_run:walking, Series B: exercise / heart_rate / filter walk_run:running
- Case #9: Run distance vs run duration — Series A: exercise / distance_miles / filter walk_run:running, Series B: exercise / duration_minutes / filter walk_run:running


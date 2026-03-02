

## Better default colors, color pickers, and auto-preview

Three changes to `CompareChartBuilder`:

### 1. Better default colors

Replace the current hard-coded blue/orange with softer colors that match the app's thematic palette. Series A will inherit from the metric's existing color map in `chart-dsl.ts` (blue family for food, purple for exercise). Series B will use a complementary muted tone picked from the same map. The `DUAL_SERIES_COLORS` fallback palette in `chart-merge.ts` will also be updated to softer, more harmonious options.

**Default palette update (`chart-merge.ts`):**
- Replace the current vivid `DUAL_SERIES_COLORS` (`#E11D48`, `#F59E0B`, etc.) with muted alternatives that fit the app's zinc/blue/purple aesthetic — e.g., `#6366F1` (indigo), `#14B8A6` (teal), `#F59E0B` (amber, kept but used sparingly), `#EC4899` (pink), `#8B5CF6` (violet).

### 2. Color picker per series

Add a color `<input type="color">` swatch to each `SeriesRow`, stored as part of `SeriesConfig`. The chosen color flows into the DSL build and overrides the auto-picked color in the merged spec.

**`CompareChartBuilder.tsx` changes:**
- Add `color: string` to `SeriesConfig`, defaulting to theme-appropriate colors based on source (food → `#3B82F6`, exercise → `#8B5CF6`).
- Add a small circular `<input type="color" />` at the end of each `SeriesRow` flex row, styled as a 24px circle with the current color as background.
- When source changes, reset color to the new source default.
- Pass `colorA` and `colorB` through to the merge step, overriding the auto-pick logic.

**`chart-merge.ts` changes:**
- Add optional `colorOverrides?: { colorA?: string; colorB?: string }` parameter to `mergeChartSpecs`.
- Use `colorOverrides.colorA` for `spec.color` and `colorOverrides.colorB` for `secondSeries.color` when provided, falling back to current logic.

### 3. Auto-preview on any config change

Remove the explicit "Preview" button. Instead, trigger `handleGenerate` automatically whenever `seriesA`, `seriesB`, `groupBy`, or `period` change.

**`CompareChartBuilder.tsx` changes:**
- Replace the manual button click with a `useEffect` that calls `handleGenerate()` on mount and whenever the config deps change. This is an appropriate use of `useEffect` — it's synchronizing React state with an external system (fetching data from the database).
- Remove the "Preview" button from the UI.
- Show a small inline loading spinner near the chart area instead.


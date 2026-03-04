

## Single-Series Chart Builder

Replace the AI text prompt as the **default** single-series creation path with a deterministic form UI — same pattern as `CompareChartBuilder`. The AI prompt becomes an optional "Ask AI" escape hatch for complex requests.

### UI Layout (inside `CustomChartDialog` when `dialogMode === "single"`)

New component: `SingleChartBuilder` — mirrors `CompareChartBuilder`'s auto-preview pattern.

**Controls (top to bottom):**

1. **Source** — Food / Exercise (select)
2. **Metric** — from `FOOD_METRICS` or `EXERCISE_METRICS` (select)
3. **Exercise filter** — Exercise key + optional subtype (conditional, same as compare builder)
4. **Chart type** — Bar / Line / Area (select)
5. **Group by** — Daily / Weekly / Day of week / Hour of day / By item / By category (select)
6. **Aggregation** — Sum / Average / Max / Min / Count (select, default: sum)
7. **Rolling average** — None / 3 / 5 / 7 / 14 / 30 (select, only visible when group by is date or week)
8. **Color** — color picker dot (same as compare builder)

Auto-preview regenerates on any change (same `useCallback` + `useEffect` pattern). Save button below the preview.

**"Ask AI" escape hatch**: Small text link below the builder controls — "Or describe a chart with AI" — switches to the current text prompt + chips UI. This covers `classify`, `cumulative`, `offset`, `compare`, `derivedMetric`, and other advanced DSL features.

### Technical approach

- **New file**: `src/components/SingleChartBuilder.tsx`
- Props match `CompareChartBuilder`: `period`, `onSave`, `isSaving`, plus optional `initialDsl` for editing
- Builds a `ChartDSL` from the form state, calls `fetchChartData` + `executeDSL` client-side (no AI call)
- `onSave` returns `{ question: string, chartSpec, chartDsl }` (auto-generated question from selections)

### Changes to `CustomChartDialog.tsx`

- When `dialogMode === "single"`, render a new layout with two sub-modes:
  - **"Builder"** (default) — renders `SingleChartBuilder`
  - **"Ask AI"** — renders the existing text prompt + chips UI (current code, extracted as-is)
- Toggle between them via a small link/button, not a prominent toggle
- When editing an existing chart that has a `chartDsl`, pre-populate the builder from it
- When editing a chart without `chartDsl` (v1), open in "Ask AI" mode

### What this does NOT cover (left to "Ask AI")

- `classify` / `dayClassification` grouping
- `derivedMetric` (protein_pct, net_carbs, etc.)
- `transform: "cumulative"`
- `offset` (TDEE baseline subtraction)
- `compare` (second metric on same chart — that's the Compare tab)
- `filter.dayOfWeek` and `filter.category`
- `sort` / `limit`

These are the ~20% of cases where natural language genuinely helps.


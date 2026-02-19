

## Separate v2 into a clean, layered architecture

### Problem

Today, v1 and v2 share a single monolithic edge function (`generate-chart`). For v2, the AI only needs to return a DSL describing *what* chart to build -- it doesn't need the user's actual data. Yet the edge function fetches every food entry, exercise set, and custom log, serializes it all into a giant prompt, builds `dailyTotals`, and ships everything back. This is wasteful, slow, and architecturally confusing -- the two modes have fundamentally different responsibilities tangled together.

### Proposed architecture

Four clean layers, each with a single responsibility:

```text
Layer 1: Types (shared contracts)
  src/lib/chart-types.ts
  - ChartDSL, DailyTotals, HourlyTotals, FoodDayTotals, ExerciseDayTotals
  - No logic, no imports beyond date-fns types

Layer 2: Data fetcher (client-side DB queries)
  src/lib/chart-data.ts
  - fetchChartData(supabaseClient, source, period, dsl) -> DailyTotals
  - Queries food_entries / weight_sets directly using the Supabase JS client
  - Aggregates into DailyTotals shape
  - Builds hourly buckets from created_at when groupBy === "hourOfDay"
  - Filters by exerciseKey when the DSL requests it
  - Pure async functions, no React, fully testable

Layer 3: DSL engine (pure transformation)
  src/lib/chart-dsl.ts (refactored)
  - executeDSL(dsl, dailyTotals) -> ChartSpec
  - Stays synchronous and pure -- no DB calls, no side effects
  - Implements ALL groupBy options including hourOfDay
  - Implements exerciseKey filtering (reads from per-key-per-date data)

Layer 4: Orchestration (React hook)
  src/hooks/useGenerateChart.ts
  - v2 path: call new edge function -> get DSL -> fetchChartData -> executeDSL
  - v1 path: call existing edge function (unchanged)
```

And one new edge function:

```text
supabase/functions/generate-chart-dsl/index.ts
  - Receives: messages + period (for context like "last 30 days")
  - System prompt describes DB SCHEMA (column names, types, JSONB shapes) + DSL spec
  - Does NOT fetch any user data
  - Returns: { chartDSL }
```

### What flows where

```text
CustomChartDialog (period, mode)
    |
    v
useGenerateChart(messages, period, mode)
    |
    |-- v2 path ----------------------------------------
    |   |                                               |
    |   v                                               |
    |   generate-chart-dsl edge function                |
    |   (messages, period) -> { chartDSL }              |
    |   |                                               |
    |   v                                               |
    |   fetchChartData(supabase, chartDSL, period)      |
    |   -> DailyTotals (with hourly data if needed)     |
    |   |                                               |
    |   v                                               |
    |   executeDSL(chartDSL, dailyTotals) -> ChartSpec  |
    |                                                   |
    |-- v1 path ----------------------------------------
    |   |
    |   v
    |   generate-chart edge function (unchanged)
    |   (messages, period) -> { chartSpec, dailyTotals }
    |
    v
{ chartSpec, dailyTotals, chartDSL? } -> CustomChartDialog -> DynamicChart
```

### Detailed file changes

**1. `src/lib/chart-types.ts` (new) -- shared type contracts**

Extract all shared types here so there are no circular imports:

- `FoodDayTotals`: `{ cal, protein, carbs, fat, fiber, sugar, sat_fat, sodium, chol, entries }`
- `ExerciseDayTotals`: `{ sets, duration, distance, cal_burned, unique_exercises }`
- `HourlyTotals`: same shapes but keyed by hour (0-23) instead of date
- `DailyTotals`: `{ food, exercise, exerciseByKey?, foodByHour?, exerciseByHour? }`
- `ChartDSL`: moved here from `chart-dsl.ts` (with `hourOfDay` in the groupBy union)
- `ExerciseByKeyByDate`: `Record<string, Record<string, ExerciseDayTotals>>` -- per exercise key, per date

**2. `src/lib/chart-data.ts` (new) -- client-side data fetcher**

Functions that query the DB and build the `DailyTotals` the DSL engine needs:

- `fetchChartData(supabase, dsl, period)` -- main entry point
  - Determines which table(s) to query based on `dsl.source`
  - Computes `startDate` from `period`
  - For food: queries `food_entries`, iterates `food_items` JSONB to sum per-date totals
  - For exercise: queries `weight_sets`, aggregates per-date totals
  - When `dsl.groupBy === "hourOfDay"`: also buckets by `new Date(created_at).getHours()` into `foodByHour` / `exerciseByHour`
  - When `dsl.filter?.exerciseKey`: builds per-exercise-key-per-date data so the DSL engine can filter
  - Returns a `DailyTotals` object ready for `executeDSL`

This function only selects the columns it needs (not `SELECT *`), and uses the typed Supabase client.

**3. `src/lib/chart-dsl.ts` (refactored) -- pure DSL engine**

- Import types from `chart-types.ts` instead of defining them or importing from `useGenerateChart`
- Implement the `hourOfDay` case: read from `dailyTotals.foodByHour` / `exerciseByHour`, format hours 0-23 as "12am", "1am"..."11pm", apply aggregation
- Implement `exerciseKey` filter: when `dsl.filter?.exerciseKey` is set and `dailyTotals` has per-key-per-date data, use it instead of the aggregate daily exercise totals
- Stays synchronous, pure, and testable without mocks

**4. `supabase/functions/generate-chart-dsl/index.ts` (new) -- lightweight edge function**

- Auth: same JWT validation pattern as existing functions
- Receives `{ messages, period }` -- no `mode` needed (this function IS the v2 path)
- System prompt describes:
  - The DB schema (table names, column names, JSONB shapes) so the AI understands what data exists
  - The complete DSL spec with all valid values for each field
  - Rules for mapping user intent to DSL fields
- Calls AI (same gateway, `gemini-2.5-flash`, `temperature: 0.3`, `response_format: json_object`)
- Validates the response has required DSL fields (`source`, `metric`, `groupBy`, `aggregation`)
- Returns `{ chartDSL }` -- nothing else
- No DB queries at all in this function

The system prompt will describe the schema like:

```
Available data sources and their fields:

FOOD (table: food_entries):
  - eaten_date (date): the date food was eaten
  - created_at (timestamptz): when the entry was logged (use for hourOfDay)
  - total_calories, total_protein, total_carbs, total_fat (numeric)
  - food_items (jsonb array): each item has { calories, protein, carbs, fat,
    fiber, sugar, saturated_fat, sodium, cholesterol, description, portion }

EXERCISE (table: weight_sets):
  - logged_date (date), created_at (timestamptz)
  - exercise_key (text), description (text)
  - sets (int), reps (int), weight_lbs (numeric)
  - duration_minutes, distance_miles (numeric, nullable)
  - exercise_metadata (jsonb): { heart_rate, effort, calories_burned, ... }
```

**5. `supabase/config.toml`** -- register new function

Add `[functions.generate-chart-dsl]` with `verify_jwt = false`.

**6. `src/hooks/useGenerateChart.ts` (refactored) -- orchestration**

- Import types from `chart-types.ts`
- Import `fetchChartData` from `chart-data.ts`
- Import `executeDSL` from `chart-dsl.ts` (statically, no more dynamic import)
- v2 path becomes:
  1. Call `generate-chart-dsl` edge function (just messages + period)
  2. Receive `{ chartDSL }`
  3. Call `fetchChartData(supabase, chartDSL, period)` to get `DailyTotals`
  4. Call `executeDSL(chartDSL, dailyTotals)` to get `ChartSpec`
  5. Return `{ chartSpec, dailyTotals, chartDSL }`
- v1 path: unchanged (calls `generate-chart`, receives `chartSpec + dailyTotals`)

**7. `src/lib/chart-dsl.test.ts` (updated) -- add hourOfDay test**

Add a test with mock `foodByHour` data verifying correct label order ("12am" through "11pm") and aggregation.

### What stays untouched

- `supabase/functions/generate-chart/index.ts` -- v1 continues working exactly as before
- `src/components/CustomChartDialog.tsx` -- no changes needed, it already branches on mode and passes period/mode through
- `src/components/trends/DynamicChart.tsx` -- no changes, it just renders a ChartSpec
- `src/lib/chart-verification.ts` -- v1 only, stays the same

### What this enables (beyond hourOfDay)

Once data fetching lives client-side, adding new DSL capabilities becomes trivial -- no edge function changes needed:

- **exerciseKey filter**: `fetchChartData` already has the exercise rows; just group by key
- **custom log source**: add `source: "custom"` to the DSL, have `fetchChartData` query `custom_log_entries`
- **compare (dual metric)**: fetch a second metric's data and include both in the ChartSpec

### Files summary

| File | Action |
|---|---|
| `src/lib/chart-types.ts` | New -- all shared types |
| `src/lib/chart-data.ts` | New -- client-side DB queries and aggregation |
| `src/lib/chart-dsl.ts` | Refactor -- import types from chart-types, implement hourOfDay and exerciseKey filter |
| `src/lib/chart-dsl.test.ts` | Update -- add hourOfDay test |
| `supabase/functions/generate-chart-dsl/index.ts` | New -- lightweight schema-only AI call |
| `supabase/config.toml` | Add generate-chart-dsl entry |
| `src/hooks/useGenerateChart.ts` | Refactor -- v2 calls new function + client-side fetch + executeDSL |


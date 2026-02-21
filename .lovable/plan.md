
# Promote exercise_metadata to Columns + Add calories_burned_estimate

## Overview

Add 7 new columns to `weight_sets` (promoting the 6 known `exercise_metadata` JSONB fields + a new system-computed calorie burn midpoint). This makes all exercise metrics directly queryable and unlocks calorie burn charting via the DSL.

## Column Naming

| Column | Type | Source | Notes |
|--------|------|--------|-------|
| `calories_burned_override` | numeric | Promoted from `exercise_metadata.calories_burned` | User-entered or Apple Health value; takes priority |
| `effort` | numeric | Promoted from `exercise_metadata.effort` | 1-10 RPE scale |
| `heart_rate` | numeric | Promoted from `exercise_metadata.heart_rate` | BPM |
| `incline_pct` | numeric | Promoted from `exercise_metadata.incline_pct` | Treadmill/bike incline |
| `cadence_rpm` | numeric | Promoted from `exercise_metadata.cadence_rpm` | Cycling cadence |
| `speed_mph` | numeric | Promoted from `exercise_metadata.speed_mph` | Running/cycling speed |
| `calories_burned_estimate` | numeric | New: system-computed MET midpoint | Recomputed when settings change |

Resolution order for charts: `calories_burned_override ?? calories_burned_estimate ?? 0`

The existing `exercise_metadata` JSONB column is kept as a nullable catch-all.

## Exhaustive Reference Inventory

### WRITE PATHS (7 locations)

| # | File | Location | What it does today | Change needed |
|---|------|----------|-------------------|---------------|
| W1 | `src/hooks/useWeightEntries.ts` | `createEntry` mutation | Writes `exercise_metadata` from set object into INSERT | Write 6 fields as top-level columns; compute + write `calories_burned_estimate` |
| W2 | `src/hooks/useWeightEntries.ts` | `updateSet` mutation | Maps `exercise_metadata` key to `dbUpdates.exercise_metadata` | Map the 6 metadata keys to their top-level column names; recompute `calories_burned_estimate` when burn-affecting fields change |
| W3 | `src/pages/WeightLog.tsx` | `handleCalorieBurnSave` | Builds `{ ...(item.exercise_metadata ?? {}), calories_burned: calories }` and passes as `exercise_metadata` update | Write to `calories_burned_override` column directly |
| W4 | `src/pages/WeightLog.tsx` | `handleExerciseSave` / `handleMultiExerciseSave` | Calls `processExerciseSaveUpdates()` which rebuilds `exercise_metadata` JSONB | `processExerciseSaveUpdates` produces top-level column keys |
| W5 | `src/pages/WeightLog.tsx` | `handleCopyEntryToToday` | Copies `exercise_metadata` from source set | Copy the 6 promoted columns individually |
| W6 | `src/components/AppleHealthImport.tsx` | Apple Health insert | Creates `exercise_metadata: { calories_burned: w.caloriesBurned }` | Write to `calories_burned_override` column |
| W7 | `supabase/functions/analyze-weights/index.ts` | Response processing | Returns `exercise_metadata` JSONB from AI | No change -- client write path (W1) unpacks into columns |

### READ PATHS (18 locations)

| # | File | What it reads | Change needed |
|---|------|---------------|---------------|
| R1 | `src/hooks/useWeightEntries.ts` query | `row.exercise_metadata` → `WeightSet` | Map 6 new columns + keep JSONB fallback |
| R2 | `src/lib/calorie-burn.ts` | `.calories_burned`, `.effort`, `.incline_pct` from `exercise_metadata` | Read top-level fields first, fall back to JSONB |
| R3 | `src/lib/chart-data.ts` SELECT | SELECTs `exercise_metadata` | SELECT 6 new columns + `calories_burned_estimate` |
| R4 | `src/lib/chart-data.ts` daily agg | `meta?.calories_burned`, `meta?.heart_rate` | Read from columns |
| R5 | `src/lib/chart-data.ts` item agg | Same per item | Read from columns |
| R6 | `src/lib/chart-data.ts` category agg | `meta?.calories_burned` | Read from column |
| R7 | `src/lib/csv-export.ts` | All 6 keys from `set.exercise_metadata` | Read from columns |
| R8 | `src/hooks/useExportData.ts` | SELECTs `exercise_metadata` | SELECT new columns |
| R9 | `src/hooks/useWeightTrends.ts` | SELECTs `exercise_metadata`, reads `.calories_burned` | SELECT `calories_burned_override` column |
| R10 | `src/hooks/useDailyCalorieBurn.ts` | Maps exercise object to `ExerciseInput` | Fields flow through from query |
| R11 | `src/components/DetailDialog.tsx` `flattenExerciseValues` | Reads `exercise_metadata` → `_meta_*` fields | Read from top-level fields, JSONB fallback |
| R12 | `src/components/DetailDialog.tsx` `processExerciseSaveUpdates` | Rebuilds `exercise_metadata` JSONB | Produce top-level column updates |
| R13 | `src/components/CalorieBurnInline.tsx` | Maps `ex.exercise_metadata` | Fields flow through from parent |
| R14 | `src/components/CalorieBurnDialog.tsx` | Uses `get_top_exercises` results | Update DB function; client reads flow through |
| R15 | `src/components/DevToolsPanel.tsx` | Reads for display | Read from top-level fields |
| R16 | `supabase/functions/generate-chart/index.ts` | SELECTs + reads JSONB keys | SELECT columns directly |
| R17 | `supabase/functions/ask-trends-ai/index.ts` | SELECTs + reads JSONB keys | SELECT columns directly |
| R18 | `supabase/functions/generate-chart-dsl/index.ts` | AI prompt text | Document columns + `calories_burned_estimate` metric |

### TYPE DEFINITIONS (4)

| # | File | Type | Change |
|---|------|------|--------|
| T1 | `src/types/weight.ts` | `WeightSet`, `WeightSetRow`, `AnalyzedExercise`, `SavedExerciseSet` | Add 6 promoted fields + `calories_burned_estimate` |
| T2 | `src/lib/chart-types.ts` | `ExerciseDayTotals` | Add `calories_burned_estimate: number` |
| T3 | `src/lib/calorie-burn.ts` | `ExerciseInput` | Add 6 fields as optional top-level properties |
| T4 | `src/lib/csv-export.ts` | `WeightSetExport` | Add 6 fields |

### DSL ENGINE (1)

| # | File | Change |
|---|------|--------|
| D1 | `src/lib/chart-dsl.ts` | Add `calories_burned_estimate` metric; add compat key; wire into extractValue, item, category aggregation |

### DATABASE FUNCTIONS (1)

| # | Function | Change |
|---|----------|--------|
| DB1 | `get_top_exercises` | Filter on `calories_burned_override IS NULL` instead of JSONB extraction |

### TEST FILES (1)

| # | File | Change |
|---|------|--------|
| X1 | `src/lib/calorie-burn.test.ts` | Update fixtures to use top-level fields |

## Implementation Phases

### Phase 1: Database Migration
- Add 7 columns to `weight_sets`
- Backfill from existing JSONB (mapping `calories_burned` → `calories_burned_override`)
- Update `get_top_exercises` to filter on `calories_burned_override IS NULL`

### Phase 2: Type Updates (T1-T4)

### Phase 3: Write Path Updates (W1-W7)

### Phase 4: Read Path Updates (R1-R18)

### Phase 5: DSL + AI Integration (D1, R18)

### Phase 6: Settings Bulk Recompute

### Phase 7: Backfill `calories_burned_estimate`

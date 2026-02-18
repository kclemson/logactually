

## On-Demand Custom Charts: Revised Implementation Plan

### Overview
Add a "Create Chart" button to the Trends page. Users describe charts in plain language, preview them, refine with follow-ups, and save to a "My Charts" section. This plan addresses all 7 feedback points from the review.

### Addressing Each Point

**#1 -- Send ALL data fields**
The edge function will include fiber, sugar, saturated_fat, sodium, cholesterol from `food_items` JSONB (per the `FoodItem` type), plus all exercise metadata (heart rate, effort, calories_burned). The existing `ask-trends-ai` only sends cal/protein/carbs/fat at the daily level; the new function will aggregate at the item level to capture these additional nutrients.

**#2 -- Don't force rounding to whole numbers**
The system prompt will instruct the model to preserve precision as appropriate (e.g., 1 decimal for weights, mm:ss for durations) rather than rounding everything. The `DynamicChart` renderer will accept an optional `valueFormatter` in the spec.

**#3 -- "Change ONLY what the user asked for"**
The refinement instruction will simply say: "When the user asks to modify the chart, change only what they asked for. Keep everything else the same."

**#4 -- AI context field instead of subtitle for limitations**
The chart spec will include an optional `aiNote` string field. This renders below the chart in a distinct style (small italic text, muted color) -- separate from the tiny subtitle. This gives the AI room to explain assumptions, data gaps, or methodology.

**#5 -- Shared chart code (approach: build DynamicChart first, then migrate)**
After analyzing the existing chart components, there is significant duplication:

- `FoodChart`, `VolumeChart`, `CalorieBurnChart`, and `ExerciseChart` all repeat the same touch-interaction pattern (activeBarIndex state, dismiss overlay, z-index elevation, handleBarClick, handleGoToDay)
- All share the same Card/CardHeader/CardContent wrapper with identical padding
- All share the same XAxis config (fontSize 8, preserveStartEnd, tickMargin 2, height 16)
- All share the same Tooltip wiring pattern for touch devices

The recommended approach: **build the `DynamicChart` component first** with the shared patterns extracted, then in a follow-up pass, migrate the existing built-in charts to use the same shared primitives. This avoids a risky big-bang refactor before the feature even works. Specifically:

- Step 1 (this plan): Extract a `useChartInteraction` hook and a `ChartCard` wrapper component that encapsulate the shared touch/tooltip/card patterns. Use them in `DynamicChart`.
- Step 2 (follow-up): Migrate `FoodChart`, `VolumeChart`, `CalorieBurnChart` to use `ChartCard` and `useChartInteraction`. `ExerciseChart` has enough unique logic (cardio mode toggle, multi-line labels) that it may keep its own render but still use the hook.

**#6 -- Trash icon with confirm to delete**
Saved charts will use the existing `DeleteConfirmPopover` component (already used elsewhere) with the `Trash2` icon.

**#7 -- Better example chips**
Chips will suggest things NOT already built in, be more descriptive, and use the same flex-wrap layout pattern as the Ask AI dialog (`flex flex-wrap gap-1.5 items-start` with rounded-full pill styling).

Example chips:
- "Calories consumed by hour of day, averaged over last 30 days"
- "Which days of the week do I eat the most?"
- "Protein on workout days vs rest days"
- "How often do I exercise each day of the week?"

---

### Technical Implementation

#### Database: `saved_charts` table

```sql
CREATE TABLE saved_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  question text NOT NULL,
  chart_spec jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE saved_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved charts"
  ON saved_charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved charts"
  ON saved_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
CREATE POLICY "Users can delete own saved charts"
  ON saved_charts FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
```

#### Chart Spec Schema

```text
interface ChartSpec {
  chartType: "bar" | "line";
  title: string;
  subtitle?: string;
  aiNote?: string;              // AI's explanation of methodology/limitations
  xAxis: { field: string; label: string };
  yAxis: { label: string };
  color: string;
  data: Array<Record<string, any>>;
  dataKey: string;
  valueFormat?: "integer" | "decimal1" | "duration_mmss" | "none";
  referenceLine?: { value: number; label?: string };
}
```

#### Edge Function: `generate-chart`

Accepts: `{ messages: Array<{role: "user"|"assistant", content: string}>, period: number }`

On first call, `messages` has one user entry. On refinements, it includes the full conversation with prior chart specs serialized as assistant messages.

Data fetching: queries `food_entries` (with `food_items` JSONB for per-item nutrients including fiber/sugar/sodium/saturated_fat/cholesterol + `created_at` timestamps), `weight_sets`, and `custom_log_entries` for the given period.

**System prompt (exact text):**

```text
You are a data visualization assistant for a health and fitness tracking app. The user will describe a chart they want to see based on their logged data.

You have access to:
- Food log: timestamps (created_at), calories, protein, carbs, fat, fiber, sugar, saturated fat, sodium, cholesterol, item descriptions, and portions
- Exercise log: dates, exercise names, sets, reps, weight (lbs), duration (minutes), distance (miles), and metadata including heart rate, effort level, and reported calories burned
- Custom log entries: dates, numeric values, text values, and units

Your job:
1. Determine the right aggregation and grouping for the user's request
2. Compute the data from the raw logs provided
3. Return a chart specification using the generate_chart tool

Rules:
- The data array must contain the actual computed values, not raw log entries
- Each item in the data array must have a value for the xAxis field and the dataKey field
- Use short, readable labels for the x-axis (e.g., "6am", "Mon", "Jan 5")
- Choose a color hex code that fits the data type (blue shades for calories, green for protein, teal for custom logs, purple for exercise)
- For time-of-day analysis, use the created_at timestamps, not the date fields
- Preserve numeric precision as appropriate: use 1 decimal place for weights and averages, whole numbers for counts and calories, mm:ss format description for durations in the title/subtitle
- When the user asks to modify the previous chart, change only what they asked for. Keep everything else the same.
- If the data is insufficient for the request, still return the best chart you can and explain any limitations or assumptions in the aiNote field
```

**Tool definition:**

```text
{
  type: "function",
  function: {
    name: "generate_chart",
    parameters: {
      type: "object",
      properties: {
        chartType: { type: "string", enum: ["bar", "line"] },
        title: { type: "string" },
        subtitle: { type: "string" },
        aiNote: { type: "string", description: "Brief explanation of methodology, assumptions, or data limitations" },
        xAxisField: { type: "string" },
        xAxisLabel: { type: "string" },
        yAxisLabel: { type: "string" },
        dataKey: { type: "string" },
        color: { type: "string", description: "Hex color code" },
        data: { type: "array", items: { type: "object", additionalProperties: true } },
        valueFormat: { type: "string", enum: ["integer", "decimal1", "duration_mmss", "none"], description: "How to format numeric labels on the chart" },
        referenceLineValue: { type: "number" },
        referenceLineLabel: { type: "string" }
      },
      required: ["chartType", "title", "xAxisField", "xAxisLabel", "yAxisLabel", "dataKey", "color", "data"]
    }
  }
}
```

Model: `google/gemini-2.5-flash` via Lovable AI gateway.

#### Shared Chart Primitives (new)

**`src/hooks/useChartInteraction.ts`**
Extracts the repeated touch interaction pattern:
- `activeBarIndex` state
- `handleBarClick` (toggle on touch, navigate on hover)
- `handleGoToDay` (reset + navigate)
- Reset on data change

**`src/components/trends/ChartCard.tsx`**
Wraps the repeated Card/overlay/z-index pattern:
- Card with conditional z-50 elevation
- Fixed inset dismiss overlay when tooltip active
- Relative z-20 inner wrapper
- CardHeader with ChartTitle + optional ChartSubtitle
- CardContent slot for the chart

#### New Components

**`src/components/trends/DynamicChart.tsx`**
Uses `ChartCard` and `useChartInteraction`. Renders either Recharts `BarChart` or `LineChart` based on spec. Includes label rendering using the same density-based spacing from `chart-label-interval.ts`. Handles `valueFormat` for label formatting. Renders `aiNote` below the chart if present.

**`src/components/CreateChartDialog.tsx`**
- Dialog with text input + example chips (flex-wrap pill layout matching Ask AI dialog)
- After chart generated: shows chart via `DynamicChart` + refinement input below
- Refinement input: "Refine this chart..." placeholder
- Buttons: "Save to Trends" and "Start over"
- Maintains `messages` array for conversation context
- No AI branding -- just "Create Chart"

#### New Hooks

**`src/hooks/useGenerateChart.ts`**
Mutation hook: `supabase.functions.invoke('generate-chart', ...)` returning `{ chartSpec }`

**`src/hooks/useSavedCharts.ts`**
React Query CRUD for `saved_charts` table (fetch, insert, delete)

#### Trends Page Changes

**`src/pages/Trends.tsx`**
- Add `+ Chart` button (outline, sm) in the period selector row, right-aligned or after the 90 days button
- Add "My Charts" `CollapsibleSection` (with BarChart3 icon) when saved charts exist, rendered above Food Trends
- Each saved chart: `DynamicChart` with a trash icon using `DeleteConfirmPopover`

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-chart/index.ts` | Edge function |
| `src/hooks/useChartInteraction.ts` | Shared touch interaction hook |
| `src/components/trends/ChartCard.tsx` | Shared chart card wrapper |
| `src/components/trends/DynamicChart.tsx` | Generic chart renderer |
| `src/components/CreateChartDialog.tsx` | Creation dialog with refinement |
| `src/hooks/useGenerateChart.ts` | Edge function mutation hook |
| `src/hooks/useSavedCharts.ts` | Saved charts CRUD hook |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Add button + My Charts section |
| `supabase/config.toml` | Add `[functions.generate-chart]` entry |

### Implementation Order

1. Database migration (saved_charts table)
2. `useChartInteraction` hook + `ChartCard` wrapper
3. `DynamicChart` component (test with hardcoded spec)
4. `generate-chart` edge function
5. `useGenerateChart` + `useSavedCharts` hooks
6. `CreateChartDialog`
7. Trends page integration
8. Follow-up: migrate existing charts to shared primitives


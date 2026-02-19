

## Add AI Note to Chart DSL v2

### What changes

The AI will generate a short human-readable note explaining what the chart shows (e.g., "Average daily protein intake over the last 30 days"). This note appears as subtle italic text below the chart, matching the existing `aiNote` rendering in `DynamicChart`.

### 1. Add `aiNote` to ChartDSL type

**File: `src/lib/chart-types.ts`**

Add an optional `aiNote?: string` field to the `ChartDSL` interface, alongside `title`.

### 2. Update the edge function prompt

**File: `supabase/functions/generate-chart-dsl/index.ts`**

- Add `"aiNote": "Brief note explaining what the chart shows, or null"` to the JSON schema in the system prompt.
- Add a short instruction: "Use aiNote to briefly describe what the chart measures and how to read it (e.g. 'Sum of daily calories over the last 30 days'). Keep it under 15 words."

### 3. Pass aiNote through the DSL engine

**File: `src/lib/chart-dsl.ts`**

In `executeDSL`, copy `dsl.aiNote` into the returned `ChartSpec`:

```
chartSpec.aiNote = dsl.aiNote ?? undefined;
```

The `DynamicChart` component already renders `spec.aiNote` as a footer -- no UI changes needed.

### 4. Stop stripping aiNote from saved charts

**File: `src/pages/Trends.tsx`**

Remove the `aiNote: undefined` override when rendering saved charts, so the note persists after pinning.

### Files changed

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `aiNote?: string` to `ChartDSL` |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `aiNote` to DSL schema and prompt instructions |
| `src/lib/chart-dsl.ts` | Pass `dsl.aiNote` through to `ChartSpec` in `executeDSL` |
| `src/pages/Trends.tsx` | Remove `aiNote: undefined` override on saved charts |

### What does NOT change

- `DynamicChart.tsx` -- already renders `aiNote` as italic footer text
- `ChartCard.tsx` -- already accepts a `footer` prop
- `useGenerateChart.ts` -- passes DSL through unchanged
- Database schema -- no changes needed

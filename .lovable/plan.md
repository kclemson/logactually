

## Add `limit` field to chart DSL

### Problem

The DSL has no way to cap the number of results, so "top 10" queries return all items.

### Solution

Add an optional `limit` field to the schema and a single line of prompt guidance. The AI model understands the concept of limiting results -- it just needs the field to exist.

### Changes

| File | Change |
|---|---|
| `src/lib/chart-types.ts` | Add `limit?: number` to `ChartDSL` interface |
| `src/lib/chart-dsl.ts` | After sorting, slice: `if (dsl.limit) dataPoints = dataPoints.slice(0, dsl.limit);` |
| `supabase/functions/generate-chart-dsl/index.ts` | Add `"limit": "<positive integer or null>"` to the DSL JSON schema in the prompt |

No additional prompt prose needed -- the field name and type are self-explanatory to the model.


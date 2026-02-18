

## Fix: Include exercise_key and exercise_subtype in chart generation context

### Problem
The `generate-chart` edge function queries `exercise_key` and `exercise_subtype` from the database (line 132) but never includes them in the text context sent to the AI model. Only `description` (the display name) is sent. This means the AI cannot distinguish between subtypes like walking vs running under `walk_run`, and cannot reliably group exercises by their canonical key.

### Fix
In `supabase/functions/generate-chart/index.ts`, line 188, add `exercise_key` and `exercise_subtype` to the parts array:

```typescript
const parts = [`date=${s.logged_date}`, `key=${s.exercise_key}`, `name="${s.description}"`];
if (s.exercise_subtype) parts.push(`subtype=${s.exercise_subtype}`);
```

This also addresses the "stuck at generating" bug investigation -- while we're in this file, we should also fix the duplicate key warning and add the diagnostic logging from the previous approved plan.

### Files to modify
- `supabase/functions/generate-chart/index.ts` -- add `key=` and `subtype=` to exercise context lines
- `src/pages/Trends.tsx` -- fix duplicate `walk_run` React key (use composite key with index)
- `src/hooks/useGenerateChart.ts` -- add diagnostic console.log and guard for missing chartSpec
- `src/components/CreateChartDialog.tsx` -- add console.error in catch block

### All changes are small, single-line additions.

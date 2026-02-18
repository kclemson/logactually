
## Write edge function tests for `generate-chart`

### Goal
Create an automated test suite that calls the deployed `generate-chart` edge function with real prompts and validates the response structure, catching the "empty data" bug and other structural issues before manual testing.

### Test file
**`supabase/functions/generate-chart/index_test.ts`**

### Test cases

1. **Valid chart response structure** -- Send a simple prompt ("daily calories last 7 days"), assert:
   - Response is 200 with `chartSpec` present
   - `chartSpec.chartType` is "bar" or "line"
   - `chartSpec.title` is a non-empty string
   - `chartSpec.xAxis.field` and `chartSpec.dataKey` are non-empty strings
   - `chartSpec.data` is a non-empty array
   - Every item in `chartSpec.data` has a key matching `xAxis.field` and `dataKey` (catches the empty `{}` bug)
   - `chartSpec.color` is a valid hex color

2. **Data values are numeric** -- Assert every data point's `dataKey` value is a number (not null, not string, not undefined)

3. **Rejects empty messages** -- Send `messages: []`, expect an error response

4. **Handles unknown request gracefully** -- Send a nonsensical prompt, assert we still get either a valid chart or a meaningful error (not a 500)

### Technical details

- Uses `Deno.test()` with `import "https://deno.land/std@0.224.0/dotenv/load.ts"` to load env vars
- Calls the deployed function via `fetch` with the user's auth token from a test sign-in using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Since this calls the real AI, tests use a 60s timeout
- All response bodies are consumed to prevent Deno resource leaks
- A shared helper function validates the `ChartSpec` shape to keep tests DRY

### After writing the tests
- Run them with the Deno test runner
- Inspect failures to identify and fix root causes in the edge function
- Iterate until all tests pass

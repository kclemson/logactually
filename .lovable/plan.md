

## Fix test credentials and run tests to validate generate-chart

### Problem
The test file uses the wrong demo password (`demo1234` instead of `demodemo`), causing all authenticated tests to fail with "Invalid login credentials".

### Changes

**File: `supabase/functions/generate-chart/index_test.ts`**

Update the demo password on line 17 from `"demo1234"` to `"demodemo"` (matching the constant in `src/lib/demo-mode.ts`).

### After the fix
Run the tests again. If chart structure or data tests fail, diagnose using the response data and fix the edge function accordingly. Iterate until all 5 tests pass.

### Technical details
- Single line change: `password: "demo1234"` to `password: "demodemo"`
- Then run the Deno test suite with 120s timeout
- Inspect any remaining failures and fix root causes in the edge function


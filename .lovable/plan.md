

# Increase logged prompt length to 400 characters

## Change
Update `.slice(0, 80)` to `.slice(0, 400)` in all 4 occurrences across 2 edge functions:

### `supabase/functions/generate-chart-dsl/index.ts`
- Line 344 (unsupported path)
- Line 358 (options path)
- Line 372 (DSL path)

### `supabase/functions/generate-chart/index.ts`
- Line 458

Both functions will be redeployed after the change.


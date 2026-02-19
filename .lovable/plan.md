
# Fix: Remove `temperature` Parameter from AI Calls

## Root Cause

The edge function logs confirm the exact failure chain:
1. `google/gemini-3-flash-preview` fails with 500 (Gemini outage)
2. Fallback fires → `openai/gpt-5-mini` rejects with 400: `"temperature does not support 0.3 with this model. Only the default (1) value is supported."`
3. Both models fail → the function returns 500 to the client

The `temperature: 0.3` parameter was hardcoded into the AI call body in `analyze-food`. OpenAI's `gpt-5-mini` does not accept non-default temperature values.

## Fix

Remove `temperature` from the request body in all functions that pass it. The default temperature (`1`) is acceptable for structured food/exercise analysis — the JSON output format is enforced by the prompt, not by temperature.

## Files to update

| File | Issue |
|---|---|
| `supabase/functions/analyze-food/index.ts` | `temperature: 0.3` passed to `callAI` — confirmed failing in logs |
| All other AI edge functions | Audit and remove `temperature` if present, to prevent the same issue on fallback |

## Specifically in `analyze-food/index.ts`

The `callAI` call currently passes:
```typescript
const response = await callAI({
  messages: [...],
  temperature: 0.3,   // ← this kills the OpenAI fallback
});
```

Change to:
```typescript
const response = await callAI({
  messages: [...],
  // temperature omitted — uses model default
});
```

## Why this is safe

- `temperature: 0.3` was chosen to reduce randomness in nutritional estimates, but the prompt itself enforces structured JSON output with explicit instructions. Removing the parameter falls back to the model default (`1`), which still produces consistent, well-structured results.
- The food analysis prompt already contains explicit instructions like "return only valid JSON" which are far more effective than temperature at controlling output format.
- `analyze-weights` already works (per the user's report) — its fallback succeeded — so it either doesn't pass temperature or uses a compatible value.

## Scope of audit

Also check `ask-trends-ai`, `lookup-upc`, `generate-chart`, `generate-chart-dsl`, `analyze-food-photo`, and `populate-demo-data` for any hardcoded `temperature` values, and remove them all to prevent the same failure mode on those functions' fallbacks.

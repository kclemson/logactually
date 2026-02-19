
# Add AI Model Fallback for Resilience Against Gateway Outages

## Problem

All four AI edge functions use `google/gemini-3-flash-preview` exclusively. When this preview model has an outage (as happened today), there is no fallback — every AI feature in the app fails with a 500 error. The error is from the Lovable AI Gateway, not application code.

## Solution

Add a **try-primary-then-fallback** retry pattern inside each edge function's AI call. If `google/gemini-3-flash-preview` returns a non-2xx response, the function immediately retries the identical request with `google/gemini-2.5-flash` (the stable, production-grade equivalent). The fallback result is treated exactly like a primary result — no behavior change for the user.

This is purely defensive — it does not change the prompt, the response format, or any other logic.

---

## Model strategy

| Role | Model |
|---|---|
| Primary | `google/gemini-3-flash-preview` (fast, current) |
| Fallback | `google/gemini-2.5-flash` (stable, equivalent capability) |

---

## Files to change (4 edge functions)

### 1. `supabase/functions/analyze-food/index.ts`

Extract the AI fetch into a small helper that tries primary then fallback:

```typescript
async function callAI(body: object): Promise<Response> {
  const models = ['google/gemini-3-flash-preview', 'google/gemini-2.5-flash'];
  let lastResponse: Response | null = null;
  for (const model of models) {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model }),
    });
    if (response.ok) return response;
    lastResponse = response;
    console.warn(`Model ${model} failed with ${response.status}, trying fallback...`);
  }
  return lastResponse!;
}
```

Replace the single `fetch(...)` call with `callAI(...)`.

### 2. `supabase/functions/ask-trends-ai/index.ts`

Same pattern — replace the single model fetch with the two-model retry loop.

### 3. `supabase/functions/lookup-upc/index.ts`

Same pattern.

### 4. `supabase/functions/populate-demo-data/index.ts`

Same pattern (this is admin-only, lower priority but worth making consistent).

---

## What does NOT change

- Prompts are identical regardless of which model responds
- Response parsing is unchanged
- Error handling after the AI call is unchanged — if both models fail, the existing error path fires exactly as today
- No new dependencies

---

## Why this is safe

`gemini-2.5-flash` is a fully stable, production model with the same capabilities as `gemini-3-flash-preview`. The preview model is used because it is newer and faster, but in an outage scenario the fallback produces identical quality results. Users will not notice the difference.

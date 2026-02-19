
# Simplify AI Fallback to a 2-Model Cross-Provider Chain

## The Problem with 3 Models

The current (pending) plan adds `openai/gpt-5-mini` as a third option after two Gemini models:

```
gemini-3-flash-preview → gemini-2.5-flash → openai/gpt-5-mini
```

During a Gemini provider outage, the app makes **two failing requests** — each with its own network round-trip and timeout — before finally reaching OpenAI. That's wasted latency (potentially 10–20 seconds of failed calls) on every request during an outage.

The only scenario where `gemini-2.5-flash` helps is if the **preview** model breaks specifically (e.g. deprecated) while the rest of Gemini stays up. That's a much rarer event than a provider-wide outage. The tradeoff isn't worth it.

## The Better Design

```
google/gemini-3-flash-preview  →  openai/gpt-5-mini
```

- Normal operation: Gemini flash preview (fast, current)
- Gemini outage: OpenAI gpt-5-mini (different infrastructure, unaffected)
- One failed request maximum before a working response

## Files to Update

While doing this, the search also revealed that 3 additional functions have **no fallback at all** — they use a single hardcoded model with no retry. Folding those in for completeness:

| Function | Current state | Change |
|---|---|---|
| `analyze-food/index.ts` | `[gemini-3-flash-preview, gemini-2.5-flash]` | Replace with `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `ask-trends-ai/index.ts` | `[gemini-3-flash-preview, gemini-2.5-flash]` | Replace with `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `lookup-upc/index.ts` | `[gemini-3-flash-preview, gemini-2.5-flash]` | Replace with `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `populate-demo-data/index.ts` | `[gemini-3-flash-preview, gemini-2.5-flash]` | Replace with `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `analyze-weights/index.ts` | Single model: `gemini-2.5-flash` (no fallback) | Add loop: `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `analyze-food-photo/index.ts` | Single model: `gemini-2.5-flash` (no fallback) | Add loop: `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `generate-chart/index.ts` | Single model: `gemini-2.5-flash` (no fallback) | Add loop: `[gemini-3-flash-preview, openai/gpt-5-mini]` |
| `generate-chart-dsl/index.ts` | Single model: `gemini-2.5-flash` (no fallback) | Add loop: `[gemini-3-flash-preview, openai/gpt-5-mini]` |

Note: `analyze-food-photo` and `generate-chart` use vision/image inputs — `openai/gpt-5-mini` is multimodal and handles image inputs correctly, so the fallback is safe there too.

## What Does NOT Change

- Prompts are identical — `gpt-5-mini` handles all the same structured JSON tasks
- Response parsing is unchanged
- Error handling is unchanged — if both models fail, the existing error path fires as today
- No new dependencies, no new secrets

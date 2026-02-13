

## Always include both food and exercise data in Ask AI

Since 90 days of aggregated food data (~90 lines) plus exercise entries together stay well within the model's token budget, we'll always fetch and include both datasets regardless of which tab the user opened Ask AI from. This enables cross-domain questions like "how do my eating habits relate to my exercise patterns?"

### Changes

**`supabase/functions/ask-trends-ai/index.ts`**

- Remove the `if/else` branching on `mode` for data fetching
- Always fetch both food entries and exercise entries for the last 90 days
- Concatenate both into `dataContext` (food section + exercise section)
- Keep the `mode` parameter — use it only for the system prompt tone (nutrition-focused vs fitness-focused) so the AI knows the user's primary interest
- Update the system prompt to mention that both food and exercise data are provided, and the user's primary interest is `{mode}`

**`src/hooks/useAskTrendsAI.ts`**

- No changes needed — `mode` is still passed and used for prompt framing

**`src/components/AskTrendsAIDialog.tsx`**

- No changes needed — the mode still drives which suggestion chips appear, which is correct since the user opened it from a specific tab

### Technical detail

The edge function data assembly becomes:

```
// Always fetch food
const foodContext = buildFoodContext(...)

// Always fetch exercise  
const exerciseContext = buildExerciseContext(...)

dataContext = [foodContext, exerciseContext].filter(Boolean).join("\n\n")
```

The system prompt updates to:

```
You are a concise health and fitness analyst. The user opened this from 
the {mode} tab, so weight your answer toward {modeLabel} — but you have 
access to both their food and exercise logs. Answer cross-domain questions 
when asked.
```

### Validation

The `mode` input validation remains (must be "food" or "exercise") since it's still used for prompt framing and the frontend chip selection. No database or client changes required.

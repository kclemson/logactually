

## Update Distance Instruction in Experimental Weights Prompt

### Change

**File: `supabase/functions/_shared/prompts.ts`**

In `ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL` only, change the `distance_miles` bullet from:

```
- distance_miles: distance in miles (number), if relevant. Convert km to miles (1km = 0.621mi).
```

to:

```
- distance_miles: distance in miles (number), if available. Convert km to miles (1km = 0.621mi).
```

Single word change: "relevant" to "available". Default prompt stays unchanged so you can A/B test.

### Deployment
- Redeploy the `analyze-weights` edge function after the edit.


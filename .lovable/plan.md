

## Simplify prompt: default to `entries` when metric is ambiguous

### Problem

The previously proposed fix was too narrow — it only addressed `category` comparisons defaulting to `cal_burned`. But the same issue applies broadly: when the user asks a vague question like "cardio vs strength split" or "exercise breakdown," the AI shouldn't guess a specific metric like `cal_burned` or `sets`. It should default to `entries` (session count) since that's the most universally meaningful and consistently populated metric.

### Solution

Add one short general guideline to the prompt instead of a category-specific rule.

### Changes

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | Add a brief "DEFAULT METRIC" note in the GENERAL section at the bottom of the prompt |

### Prompt addition (in the GENERAL section)

```
- When the user's request does not specify a metric (e.g. "cardio vs strength
  split", "exercise breakdown", "what do I eat"), default to "entries" (session
  count). It is the most universally populated and intuitive measure of activity.
```

This covers category splits, vague breakdowns, and any other case where the AI would otherwise guess a metric that may be sparsely populated.


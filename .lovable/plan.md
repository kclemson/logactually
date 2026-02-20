

# Remove remaining anchoring examples from generate-chart-dsl prompt

## Changes

**Single file: `supabase/functions/generate-chart-dsl/index.ts`**

### 1. Line 189 — Remove inline examples from dayClassification intro

Current:
```
Use groupBy "dayClassification" when the user wants to partition their logged days into two labeled groups and count days in each group. This produces a 2-bar chart showing the count of days in each bucket. Examples: "rest days vs workout days", "high protein days vs low protein days", "leg day vs non-leg day", "days I only walked vs days I did more".
```

Change to:
```
Use groupBy "dayClassification" when the user wants to partition their logged days into two labeled groups and count days in each group. This produces a 2-bar chart showing the count of days in each bucket.
```

The six rule descriptions that follow already convey when dayClassification applies. The examples add anchoring risk (notably "days I only walked" is still here) without adding clarity.

### 2. Line 228 — Remove defensive "Do NOT use this for..." list

Current:
```
Do NOT use this for heart rate, common foods, exercise frequency, cardio vs strength, rest day classification, or any query that maps cleanly to the available metrics, groupBy options, and filters above.
```

Remove entirely. If a request maps to the schema, the model should recognize that from the schema itself. This list is incomplete by nature and risks creating false negatives if it doesn't mention a valid capability.

### Why this is the right scope

These are the last two instances of the over-specification pattern that caused the `only_keys` bug. Everything else in the prompt (calories_burned warning, category vs filter.category, frequency disambiguation) addresses genuinely non-obvious distinctions that the model can't reliably infer from the schema alone.


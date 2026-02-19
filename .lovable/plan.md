

## Replace example-based rules with conceptual aggregation guidance

### Problem

The current system prompt teaches the AI what to do via specific examples ("for X do Y"). This doesn't scale -- it can't reason about novel combinations or edge cases it hasn't seen an example for. The `dayOfWeek + sum` bug is a symptom: the AI had no framework to understand *why* `average` is the right choice for categorical groupings when the user asks "which day is highest."

### The Fix

Replace the example-heavy RULES section with a short conceptual framework that explains *how groupBy and aggregation interact semantically*. The AI already understands these concepts -- it just needs the right framing to reason correctly.

### What changes

**File: `supabase/functions/generate-chart-dsl/index.ts`**

Replace the RULES block (lines 76-87) with something like:

```
AGGREGATION SEMANTICS:

When groupBy is "date" or "week" (time-series), each bucket represents a single
time period. "sum" answers "how much total that day/week", "average" answers
"average per entry that day/week".

When groupBy is categorical ("dayOfWeek", "hourOfDay", "weekdayVsWeekend"),
each bucket pools data from MANY instances across the query period. The user
almost always wants to compare a TYPICAL bucket, not a volume total that's
biased by how many times that bucket appears in the period. Default to "average"
for categorical groupings unless the user explicitly asks for totals.

"count" answers "how many days/entries had data" — use when the user asks
about frequency, not magnitude.

CHART TYPE SELECTION:

- "line" or "area" for time-series groupings (date, week) — shows trends over time
- "bar" for categorical groupings (dayOfWeek, hourOfDay, weekdayVsWeekend) — shows comparison across buckets
- When in doubt, prefer "bar" for categorical and "line" for temporal

SORTING:

- For categorical bar charts, consider sort=value_desc to rank buckets
- Never sort time-series charts (date, week) — they must stay chronological

GENERAL:

- title should be concise and descriptive
- Do NOT include any data values — only the schema
```

### Why this is better

- **Scales**: The AI can now reason about *any* groupBy + aggregation combination, including future ones we add, without needing a specific example for each.
- **Teaches the "why"**: Instead of memorizing "dayOfWeek uses average", the AI understands that categorical buckets pool unequal counts, so average is the unbiased default. It can apply this reasoning to hourOfDay, weekdayVsWeekend, or any new grouping.
- **Fewer tokens**: A short conceptual block replaces a growing list of "for X do Y" examples.
- **Handles ambiguity**: When a user says "calories by day of week", the AI can reason through "categorical grouping, user wants to compare typical days, so average" instead of pattern-matching against a memorized example.

### What stays

- The DATABASE SCHEMA section (lines 38-54) -- unchanged, this is factual reference
- The AVAILABLE METRICS, DERIVED METRICS, GROUP BY OPTIONS, FILTER OPTIONS sections -- unchanged, these are valid enum documentation
- Everything outside the system prompt -- unchanged

### Files to change

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | Replace the RULES block with the conceptual aggregation semantics section described above |


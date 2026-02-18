

## Custom Charts: prompt refinement, UI polish, expanded chips, and test automation

### 1. Hide AI note on Trends grid

**`src/pages/Trends.tsx`** -- Strip `aiNote` from spec before passing to `DynamicChart` in the saved charts grid. The note remains visible inside the `CustomChartDialog` when the user clicks to view/edit.

### 2. Constrain chart width in dialog

**`src/components/CustomChartDialog.tsx`** -- Wrap the `DynamicChart` in a centered container at ~60% width so it renders at a comfortable aspect ratio instead of stretching edge-to-edge across the dialog.

### 3. System prompt: teach the concept, not the examples

The core insight is that the AI needs to understand the difference between two aggregation modes:

- **Temporal (time-series)**: one data point per date -- the default. X-axis shows dates.
- **Categorical**: one data point per category bucket (hour, weekday, exercise name, etc.). X-axis shows the category. Values are aggregated across the full period.

Rather than listing every possible category with its expected labels, we define the concept once and add a small "common patterns" reference that maps request language to aggregation mode. This avoids example poisoning while still being precise where it matters.

**Proposed prompt additions to `supabase/functions/generate-chart/index.ts`:**

```
AGGREGATION MODES:

There are exactly two aggregation modes. Choose the right one based on what the user is asking:

1. TIME-SERIES (default): One data point per date. Use when the user asks about trends "over time", "per day", "last N days", etc. The x-axis shows calendar dates.

2. CATEGORICAL: One data point per category bucket, aggregated across the entire period. Use when the user asks to group "by" a non-date dimension (e.g. "by hour of day", "by day of week", "by exercise", "by meal"). The x-axis shows category labels, NOT dates. The data array must have exactly one entry per bucket.

For categorical charts, use rawDate of the most recent date that contributed data to that bucket.

COMMON CATEGORICAL PATTERNS:
- "by hour of day" -> 24 buckets (use labels like "12am", "1am", ... "11pm"), aggregate using created_at timestamps
- "by day of week" -> 7 buckets, ordered Sun-Sat or Mon-Sun depending on locale
- "by exercise" / "by food" -> one bucket per unique item

COMPARING GROUPS (e.g. "workout days vs rest days"):
- The result is categorical with one bucket per group
- Always explain in aiNote exactly how you defined each group
- Use only the data provided to determine group membership

ANTI-HALLUCINATION:
- Never fabricate or interpolate values. Only return values directly computable from the provided logs.
- If a bucket has no data, omit it or use zero. Do not invent values.
- All numeric values in the data array must be non-negative.
```

This is ~20 lines, teaches the concept cleanly, and only gets specific on the two most common categorical patterns (hour-of-day, day-of-week) because date handling genuinely benefits from precision. Everything else follows from the general rule.

### 4. Expand suggestion chips to ~20

**`src/components/CustomChartDialog.tsx`** -- Replace the 6 hardcoded chips with a pool of ~20. Randomly select 6 on each dialog mount using `useMemo`.

Proposed pool (organized by theme, but displayed randomly):

**Food timing and patterns:**
1. "Average calories by hour of day"
2. "Which day of the week do I eat the most?"
3. "How many meals do I log per day on average?"

**Nutrient trends:**
4. "Daily fiber intake over time"
5. "Sodium intake trend"
6. "Average sugar per day"
7. "Fat as percentage of total calories over time"
8. "Protein to calorie ratio over time"

**High/low analysis:**
9. "My highest calorie days"
10. "Days where I exceeded 2000 calories"

**Exercise:**
11. "Exercise frequency by day of week"
12. "Total exercise duration per week"
13. "Which exercises do I do most often?"
14. "How many days per week did I exercise?"

**Cross-domain:**
15. "Average calories on workout days vs rest days"
16. "Average protein on workout days vs rest days"
17. "Do I eat more on days I exercise?"

**Weekday/weekend:**
18. "Average carbs on weekdays vs weekends"
19. "Calorie comparison: weekdays vs weekends"

**Volume/strength:**
20. "Training volume trend over time"

### 5. Test automation for hallucination detection

**`supabase/functions/generate-chart/index_test.ts`** -- Add structural validation tests. These are non-deterministic (LLM output varies), so they assert on structural invariants, not exact values.

New test cases:

| Prompt | Key assertion |
|--------|---------------|
| "Average calories by hour of day" | `data.length <= 24`; all values numeric and non-negative |
| "Calories by day of week" | `data.length <= 7`; values numeric |
| "Daily calories last 7 days" | `data.length <= 7`; rawDate values within last 7 days |
| "Average protein on workout vs rest days" | `data.length <= 3` (at most 2 real groups + possible "overall"); dataSource is "mixed" |
| "Exercise frequency by day of week" | `data.length <= 7`; dataSource is "exercise" |

Each test reuses the existing `assertValidChartSpec` helper and adds per-case assertions. The tests will be deployed and run against real data from the demo account.

---

### Summary of files changed

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Strip `aiNote` from saved chart specs in grid view |
| `src/components/CustomChartDialog.tsx` | 60% width chart container; expand to ~20 chips with random selection of 6 |
| `supabase/functions/generate-chart/index.ts` | Add aggregation mode framework and anti-hallucination rules to system prompt |
| `supabase/functions/generate-chart/index_test.ts` | Add 5 content-aware validation tests |


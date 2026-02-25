

## Two Issues, Two Small Fixes

### 1. Missing "All time" subtitle

In `DynamicChart.tsx`, `periodLabel` treats `0` as falsy and returns `undefined`:

```typescript
function periodLabel(days?: number): string | undefined {
  if (!days) return undefined;  // 0 is falsy → no label
```

**Fix**: Add an explicit check for `days === 0` returning `"All time"` before the falsy guard.

### 2. AI note bakes in a specific time range

The system prompt on line 173 of `generate-chart-dsl/index.ts` includes this example:

> `"Sum of daily calories over the last 30 days"`

This teaches the AI to embed a specific period into `aiNote`. But the DSL is period-agnostic — once saved, the same chart can be viewed at 7 days, 90 days, or all time. The note becomes stale/wrong.

**Fix**: Replace that single aiNote guideline line with one that tells the AI the note should describe *what* the chart measures, not *when*. No list of prohibitions needed — just reframe the example:

```
- Use aiNote to briefly describe what the chart measures (e.g. "Average heart rate per walking session"). Keep it under 15 words. Do not reference a specific time period — the period is selected separately by the user.
```

This is semantic guidance (tell it what to do, with a good example) rather than a prohibition list. The example itself contains no time reference, which naturally steers the model away from including one.

### Files changed

| File | Change |
|------|--------|
| `src/components/trends/DynamicChart.tsx` | Add `if (days === 0) return "All time"` to `periodLabel` |
| `supabase/functions/generate-chart-dsl/index.ts` | Replace line 173's aiNote guidance with period-agnostic instruction |

Two single-line edits total.


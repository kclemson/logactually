
## Multi-chart disambiguation for ambiguous queries

### Summary

When the AI detects genuine ambiguity in a query, it returns 2–3 DSL variants instead of one. The dialog shows them side-by-side as small previews with their `aiNote` as captions. The user picks one, and the normal Save/Refine flow continues. Unambiguous queries are completely unchanged.

The single-chart preview shrinks from `w-[60%]` to `w-[50%]` — a minor visual tweak that also makes the two-up disambiguation layout feel consistent rather than introducing a different size just for that state.

---

### 1. Edge function — minimal system prompt addition

**File: `supabase/functions/generate-chart-dsl/index.ts`**

Add a short paragraph after the existing JSON schema block. No examples, no enumerated triggers:

```
DISAMBIGUATION:

If the user's request has more than one meaningfully different interpretation, respond with a JSON object containing a "chartDSLOptions" key instead of "chartDSL":

{
  "chartDSLOptions": [
    { ...full DSL object, "aiNote": "what this interpretation shows" },
    { ...full DSL object, "aiNote": "what this interpretation shows" }
  ]
}

Each option must be a complete DSL object with a distinct aiNote. Maximum 3 options. Only use this when the interpretations would produce genuinely different charts — not just minor variations.
```

Update response validation to also pass through `chartDSLOptions` if that key is present.

---

### 2. `useGenerateChart` — handle multi-option response

**File: `src/hooks/useGenerateChart.ts`**

Extend the result interface:

```typescript
export interface GenerateChartResult {
  chartSpec: ChartSpec;
  dailyTotals: DailyTotals;
  chartDSL?: ChartDSL;
  chartOptions?: Array<{ chartSpec: ChartSpec; chartDSL: ChartDSL; dailyTotals: DailyTotals }>;
}
```

In the v2 path, after the edge function responds:
- `chartDSL` present → existing single path, unchanged
- `chartDSLOptions` present → execute `fetchChartData` + `executeDSL` for each option (they share the same `period`, fully independent), populate `chartOptions`, set `chartSpec` to the first as a fallback default

---

### 3. Disambiguation UI in `CustomChartDialog`

**File: `src/components/CustomChartDialog.tsx`**

Add `chartOptions` state alongside `currentSpec`. When options are present (length > 1), replace the single-chart result with a picker:

```
"Which did you mean?"

[ Chart A preview ]  [ Chart B preview ]
  "Average per meal"   "Total across logs"

[ Cancel ]
```

- Each thumbnail is `w-[50%]` (matching the new single-chart size) with a caption below it from its `aiNote`
- Clicking a thumbnail calls `setCurrentSpec(chosen.chartSpec)` and clears `chartOptions` — drops back into the normal single-chart result view
- Cancel clears `chartOptions` and `currentSpec`, returning to the empty state
- The loading overlay applies to the disambiguation state too (the `showOverlay` logic already covers this since it keys off `generateChart.isPending && hasExistingContent`)

Single-chart preview width: `w-[60%]` → `w-[50%]` (minor, makes the sizing consistent across both states).

---

### Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | Add 8-line disambiguation rule to prompt; accept `chartDSLOptions` in validation |
| `src/hooks/useGenerateChart.ts` | Handle `chartDSLOptions` in v2 path; extend `GenerateChartResult` type |
| `src/components/CustomChartDialog.tsx` | Add `chartOptions` state; render side-by-side picker when options returned; `w-[60%]` → `w-[50%]` |

### What stays the same

- Single-chart path for unambiguous queries — completely unchanged
- v1 mode — unaffected
- Save, Refine, Edit, context menu, chips — all unchanged
- `chart-data.ts`, `chart-types.ts`, `chart-dsl.ts`, `DynamicChart.tsx` — no changes


# Fix three issues: duplicate aiNote, wrong disambiguation option, prompt verbosity

## Summary of what to fix

### Issue 1: Duplicate aiNote in disambiguation picker (code fix)

**Root cause:** In the disambiguation picker, the `DynamicChart` component renders `spec.aiNote` as an italic footer inside `ChartCard`. Immediately below that, `CustomChartDialog` also renders `opt.chartDSL.aiNote` in its own plain `<p>` tag. Both point to the same string, so it appears twice — once italic (from `DynamicChart`), once plain (from the dialog's explicit `<p>`).

**Fix:** Remove the explicit `<p>` block in `CustomChartDialog.tsx` lines 404-408:
```tsx
{opt.chartDSL.aiNote && (
  <p className="text-[10px] text-muted-foreground px-2 pb-2 text-center leading-tight">
    {opt.chartDSL.aiNote}
  </p>
)}
```

The `DynamicChart` already shows it. One render is sufficient.

**DSL debug panels: not touched.** They are intentional, admin-gated, and stay exactly as-is.

---

### Issue 2 + 3 combined: Wrong disambiguation option, concise prompt fix

**What the model did wrong:** For "total miles walked vs run", the AI offered two options:
- Option 1 (bar, `groupBy: "item"`, `exerciseKey: "walk_run"`, `exerciseSubtype: null`) — correct: groups all walk_run activity by subtype key, producing one bar per subtype
- Option 2 (line, `groupBy: "date"`, `exerciseSubtype: null`) — wrong: collapses walking and running into one merged line per day, losing the comparison entirely

**Why this is wrong:** The DSL is single-series only. A `groupBy: "date"` chart with `exerciseSubtype: null` and `exerciseKey: "walk_run"` produces one data point per day (total walk_run miles), not two lines. The model hallucinated a "over time" option that the engine cannot render as a comparison.

**The fix in two sentences**, added to the end of the DISAMBIGUATION section of the system prompt:

> **Single-series constraint:** The DSL renders one data series only. When the user wants to compare two subtypes (e.g. "walking vs running"), only `groupBy: "item"` can show them side by side — never offer `groupBy: "date"` as an alternative interpretation, because it collapses both subtypes into a single line and loses the comparison.

That's it. No paragraph, no complex reasoning — just a hard constraint. The model gets a direct rule: subtype comparisons → `groupBy: "item"`, not time-series.

**"sessions" terminology:** Not worth a prompt rule. The aiNote is admin-only context, and adding prompt text to police phrasing preferences adds noise without payoff. Leave it.

---

## Files changed

| File | Change |
|---|---|
| `src/components/CustomChartDialog.tsx` | Remove the duplicate `aiNote` `<p>` block (lines 404-408) inside the disambiguation button. The DSL debug panels below are untouched. |
| `supabase/functions/generate-chart-dsl/index.ts` | Add 2-sentence single-series constraint to end of DISAMBIGUATION section |

## Scope

- No changes to debug panel visibility or conditions
- No changes to `DynamicChart`, chart types, or data fetching
- Edge function requires redeployment after the prompt change

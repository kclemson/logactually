
# Two issues with the category calories-burned chart

## Issue 1 — Strength bar is nearly zero (the real data problem)

The `calories_burned` metric in the v2 pipeline reads from `exercise_metadata.calories_burned`, a field that is only populated when the AI explicitly extracted a calorie value from user text (e.g. "burned 300 calories"). For strength training this is almost never present — the app estimates calorie burn client-side in `useDailyCalorieBurn` via `estimateCalorieBurn()`, but that computation is separate from what gets written to `exercise_metadata`.

So the chart is technically correct given the raw data — it is showing stored calorie values only, not estimated ones. But that makes it misleading for most users who haven't manually logged calories burned.

The cleanest fix is to add a note about this in the v2 system prompt so the AI can include a caveat in `aiNote`, **and** to surface this in the `UNSUPPORTED REQUEST` guidance — because for `calories_burned` specifically, the v2 DSL will give a misleading answer unless the user has manually logged calorie data.

However, the deeper fix would be to fall back to v1 for any `metric: "calories_burned"` query, since v1 has access to the estimated totals computed server-side. This is the right call:

- Add `calories_burned` to the `generate-chart-dsl` system prompt as a note: "Only reflects manually logged values; for most users this will be near zero. If the user is asking about calories burned, prefer the `unsupported` response so the server-side estimated path (v1) is used instead."
- In the `UNSUPPORTED REQUEST` section of the system prompt, add calories burned as a case where the DSL cannot give an accurate answer.

This means the query will automatically fall back to v1 via the `usedFallback` path already implemented.

## Issue 2 — Time range is invisible to the user

The `period` prop is passed through the chain (`CustomChartDialog` → `useGenerateChart` → `fetchChartData`) but is never shown anywhere in the UI. The user has no way to know if the chart covers 30 days, 90 days, or all time.

The fix is straightforward: render a small muted time-range label inside the chart card, below the title, using the `period` value that's already available in `DynamicChart` as a prop.

### Where to add it

`DynamicChart` already receives `spec` and renders `ChartCard`. We can derive a human-readable label from the `period` prop and pass it to `ChartCard` as a new optional `timeRange` prop:

```
period 30  → "Last 30 days"
period 60  → "Last 60 days"
period 90  → "Last 90 days"
period 180 → "Last 6 months"
period 365 → "Last year"
anything else → "Last {n} days"
```

`DynamicChart` already takes a `period?: number` prop — if it doesn't yet, we add it. `ChartCard` gets a new optional `timeRange?: string` prop rendered as a small muted line below the title (where `ChartSubtitle` used to live — same slot, but now populated with the time range instead of the AI subtitle).

This is useful in both:
- The **creation dialog** (user sees what window the chart covers while building it)
- The **Trends page** pinned charts (user understands the saved chart's scope at a glance)

## Files changed

| File | Change |
|---|---|
| `supabase/functions/generate-chart-dsl/index.ts` | In the `UNSUPPORTED REQUEST` section, add `calories_burned` as a case that should return `unsupported: true` since the stored values are sparsely populated and misleading; a note in the metric list warns the AI |
| `src/components/trends/ChartCard.tsx` | Add optional `timeRange?: string` prop; render it as a small muted line below the title (reusing the slot where `ChartSubtitle` was before we removed it) |
| `src/components/trends/DynamicChart.tsx` | Accept `period?: number` prop; derive a human-readable range string and pass it to `ChartCard` as `timeRange` |
| `src/pages/Trends.tsx` | Pass `period` to `DynamicChart` when rendering pinned saved charts |
| `src/components/CustomChartDialog.tsx` | Pass `period` to `DynamicChart` in the preview area |

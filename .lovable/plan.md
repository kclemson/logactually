# Pin Bloodwork Analyte to Custom Trends

## Concept

In the bloodwork viewer, every result row gets a pin affordance next to the **analyte name**. Tapping it saves a chart for that analyte to the Custom Trends page. Tapping again unpins (and removes the chart). The pin is per-analyte (`canonical_key`), not per-result — pinning LDL in any panel toggles the same global pin and the resulting chart plots LDL across every panel the user has.

## UX

**Row anatomy becomes:** `[pin icon] [analyte name] … [value + flag]`

- Pin icon sits immediately before the name, small, same line height as the text. Lucide `Pin` icon, ~12–14px.
- **Unpinned**: outlined, muted (`text-muted-foreground/40`). Hover/tap-target: `text-foreground`.
- **Pinned**: filled, bloodwork accent color (crimson). Native `title` on the icon button: "Pinned to Trends".
- Always visible on both desktop and mobile (no hover-reveal) — discoverability matters more than absolute minimalism here, and the icon is small enough not to disrupt density.
- Click handler is scoped to the icon button only — tapping the name itself is unaffected.

**Pinned chart on Custom Trends:**

- Title = analyte `display_name`.
- Line + dots, one point per panel where this user has a `numeric_value` for that `canonical_key`. X-axis = actual `collected_date`. No daily zero-fill, no rolling average, no period selector — always all-time.
- **Shaded green reference band** across the chart Y-range from `reference_low` to `reference_high`, taken from the most recent panel. Omit band if range missing.
- Point fill: in-range = bloodwork accent; `flag === "High"` = amber; `flag === "Low"` = blue. Matches the panel-view language we just locked in.
- Tooltip on a point: date, value + unit, reference range, High/Low flag if present.
- Reorder + delete work like any other saved chart.

## What this is NOT

- Not a new source in the chart builder. The builder stays food/exercise only.
- Not compare/correlation. One analyte, one chart. Future work.
- No aggregation, no daily fill, no period filter on bloodwork charts.

## Technical

**Storage** — reuse existing `saved_charts` table. DSL for a pinned bloodwork chart:

```json
{
  "chartType": "line",
  "source": "bloodwork",
  "metric": "value",
  "filter": { "canonicalKey": "ldl_cholesterol" },
  "title": "LDL Cholesterol"
}
```

`source: "bloodwork"` is the discriminator; renderer takes the sparse-data path.

**Files touched:**

- `src/lib/chart-types.ts` — extend `ChartDSL.source` union with `"bloodwork"`; add `filter.canonicalKey?: string`; add optional `referenceRange?: { low: number | null; high: number | null }` and per-point `flag` on the chart spec.
- `src/lib/chart-data.ts` — when `dsl.source === "bloodwork"`, branch into a new bloodwork fetcher that queries `bloodwork_results` for current `user_id` + `filter.canonicalKey`, returning raw `{date, value, flag, refLow, refHigh, unit}` rows. Skips food/exercise aggregation entirely.
- `src/lib/chart-dsl.ts` — bloodwork branch in `executeDSL` mapping rows directly to a `ChartSpec`. Carries `referenceRange` (from most-recent row) + per-point flag through.
- `src/components/trends/DynamicChart.tsx` — when spec carries `referenceRange`, render a `<ReferenceArea y1={low} y2={high}>` in green at low opacity beneath the line; render `<Dot>` with per-point fill driven by flag.
- `src/components/trends/CompactChartTooltip.tsx` — surface ref range and flag when present.
- `src/hooks/usePinnedBloodworkCharts.ts` (new) — returns `Set<canonical_key>` of analytes already pinned (queries `saved_charts` for current user, filters `chart_dsl->>source = 'bloodwork'`). Powers icon state per row.
- `src/components/BloodworkPanelGroup.tsx` — render pin icon before the analyte name. On click: if not pinned, insert into `saved_charts` with DSL above (title = `display_name`); if pinned, delete the matching row. Invalidate both `saved-charts` and `pinned-bloodwork` query caches.

**Color token:** add Bloodwork = Crimson `hsl(0 65% 50%)` to the source-color palette (Food=Blue, Exercise=Purple, Custom=Teal). Will update the thematic-color memory.

**Edge cases:**

- Pinned analyte has only one draw → renders as a single dot. Acceptable.
- User deletes a panel containing pinned analytes → chart re-renders with fewer points. If zero points remain, show an empty-state inside the card rather than auto-deleting the pin (user can manually unpin from either side).
- Reference range differs across panels → use most recent. Note in tooltip optional but skipping for v1.
- Read-only/demo users: the row-level RLS already blocks inserts/deletes on `saved_charts`; the pin button should be hidden (or rendered disabled) when `is_read_only_user` is true, matching how we gate other write actions.

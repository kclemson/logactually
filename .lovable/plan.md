# Smart auto-scaling for custom log trend charts

## Goal
For "level" metrics (body weight, measurements, etc.), automatically render a **fitted line chart** so progress is visible, instead of a zero-baseline bar that crushes the signal. Phase 1 is fully automatic with smart defaults and **no stored state** — but designed so user-controlled overrides and show/hide can layer on cleanly later.

## Why a new chart mode (not a y-axis tweak)
Bars must start at 0 — truncating a bar's baseline visually lies about magnitude. The honest way to show narrow-band variation is a **line/area chart with a fitted domain**. Today `CustomLogTrendChart` sends single-series numeric data to `FoodChart` (a `BarChart` with no `YAxis`), and fills missing dates with `0`. A line needs the opposite: a fitted y-domain and `null` (not `0`) for missing days.

## The classifier (automatic, data-driven — no hardcoded names)
Computed at render time from the series already returned by `useCustomLogTrends`, in keeping with the project's semantic-minimalism principle (a general statistical rule, not an "if name = weight" list). A series is treated as **level → fitted line** when:
- it has **≥3 numeric points**, AND
- all values are **> 0**, AND
- the spread is narrow relative to magnitude: `(max − min) / max` is below a threshold (≈0.4), i.e. a zero baseline would waste most of the vertical space.

Otherwise it stays **amount → bar from zero** (water, steps, caffeine, doses, sparse/new logs, anything that legitimately touches zero). Fewer than 3 points always stays bars, so a chart doesn't flip shape on day one or two.

## Build (Phase 1 — automatic only)
1. **New `CustomLogLineChart` component** (sibling to `FoodChart`): a recharts `LineChart` mirroring `FoodChart`'s shell — same title/header, `CompactChartTooltip`, touch-tap-to-show-tooltip + outside-click handling, `onNavigate`, optional `referenceLine`, and the existing decimal `labelFormatter`. Y-domain set to `[min − pad, max + pad]` with `pad ≈ max(range * 0.1, oneSmallStep)`. Uses `connectNulls` so gaps bridge instead of dropping to the floor.
2. **`CustomLogTrendChart` routing**: for single-series numeric types, run the classifier; render `CustomLogLineChart` when level, else the current `FoodChart`. For line mode, build `chartData` with `null` for missing dates instead of `0` (bar mode keeps `0`). `dual_numeric` / `text` / `text_numeric` are unchanged in this phase.
3. **Shared by both surfaces**: because the inline custom-log dialog trend and the Trends page both render through `CustomLogTrendChart`, the same classification applies everywhere automatically — no divergence.
4. **Delta affordance (light)**: show change vs. the first visible point (e.g. "−2.3 lbs") in the line chart header, since that's the real payoff for level metrics. Reuses existing decimal precision.

## Impact on existing users (explicitly: nothing to migrate)
- **No schema change, no data migration, no backfill.** Classification is pure derived logic, so every qualifying existing custom log just gets the better chart the next time it renders.
- **No data is mutated** — entries, units, decimals untouched.
- **Who changes:** only numeric custom logs whose recent data is narrow-band and above zero (weight, measurements, body-fat %, resting HR, glucose…). Amount logs (water, steps, doses) keep bars — their experience is identical.
- **Flip risk** mitigated by the ≥3-point + ratio gate, so charts don't oscillate bar↔line as data trickles in.
- **Fully reversible**: it's display logic; reverting the code restores prior behavior with zero cleanup.

## Systemic architecture for customizability (decided now, built later)
This is the first user-customizable-chart surface, so Phase 1 is deliberately stateless to avoid locking in the wrong model. Two *separate* axes of customization, kept distinct:

- **Scale override (the natural Phase 2 of this feature):** add a `chart_scale` enum to `custom_log_types` — `auto | from_zero | fit_range`, default `auto`. `auto` defers to the Phase-1 heuristic, so the classifier stays the always-present fallback and the override is a thin layer. Surfaced as a Select in the log-type editor (matches the "prefer Select dropdowns, avoid toggles" convention).
- **Show/hide + ordering (your other ask):** this is a different concern and shouldn't be wedged onto each source table, because you want to hide *exercise* charts too — and those aren't `custom_log_types`. The scalable answer is a single per-user **`chart_preferences`** table keyed by a stable chart identifier (e.g. `exercise:<key>`, `customlog:<id>`, `bloodwork:<key>`), holding `{ visible, sort_order }` (and room for future per-chart scale on non-custom charts). The Trends list already has `sort_order` + drag/drop to build on. This unifies visibility/ordering across all chart kinds instead of scattering flags.

Recommendation: ship Phase 1 (automatic) now; treat `chart_scale` and the unified `chart_preferences` table as the next two increments once the auto behavior feels right.

## Out of scope for Phase 1
No DB changes, no override UI, no show/hide UI, no changes to `dual_numeric`/text charts. Those are the documented next steps above.

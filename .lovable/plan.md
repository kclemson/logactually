## Problem

Pinning a bloodwork analyte writes a row into `saved_charts`, which only renders inside the "My Charts" section. That section is gated by `canUseCharts` (admin/beta), so for non-gated users the pin appears to vanish. Pins should always be visible somewhere the user expects — Custom Trends — while still showing in My Charts for users who have that section.

## Plan

In `src/pages/Trends.tsx`, add a bloodwork-pins block inside the Custom Trends section. Leave My Charts behavior untouched.

1. **Derive `bloodworkCharts`** from `savedCharts`: entries where `chart_dsl?.source === "bloodwork"`. Reuse the existing `liveSpecs` map (no new query needed — bloodwork pins are v2 charts and already get refreshed).

2. **Update the Custom Trends render condition** to:
   `showCustomLogs && customLogTrends.length > 0` **OR** `bloodworkCharts.length > 0`.
   The section header stays the same (Custom Trends, teal clipboard icon).

3. **Render bloodwork pins first** inside the Custom Trends grid, using `DynamicChart` with the same live-spec merge pattern My Charts uses (`liveSpecs?.get(chart.id) ?? chart.chart_spec`, preserving saved title/aiNote). No drag/edit affordances here — pins are managed from the Bloodwork panel's pin toggle. Then render the existing `CustomLogTrendChart` items below (still gated by `showCustomLogs`).

4. **My Charts stays as-is.** Bloodwork pins continue to appear there for users with `canUseCharts`, since the user views that as the long-term home for customizable charts.

## Out of scope

- No DB or hook changes (`usePinnedBloodworkCharts`, `saved_charts` schema unchanged).
- No changes to the Bloodwork pin affordance.
- No changes to My Charts gating or behavior.

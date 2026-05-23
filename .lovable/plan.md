# Persist bloodwork view state + pinned charts in /custom

Two related changes scoped to the bloodwork (panel-type) custom log experience.

## 1. Persist bloodwork view state across navigation

All persisted to `localStorage` (device-local, matches existing patterns like `trends-period`, `custom-log-view-mode`, `trends-cardio-mode-*`).

Persisted keys:
- `bloodwork-panel-expanded:<panelId>` — per-panel expand/collapse
- `bloodwork-panel-all-collapsed` — header "collapse all" toggle
- `bloodwork-panel-query` — header filter query
- `bloodwork-type-expanded` — whether the panel-type row itself is expanded on /custom

State flow follows the project's useEffect guideline: read once via lazy `useState` initializer, write in event handlers (no `useEffect` sync).

Touchpoints:
- `src/components/CustomLogByTypeView.tsx` — lift `expanded`, `panelQuery`, `panelAllCollapsed` to lazy initializers from localStorage; persist on each setter callback. `panelCollapseTick` stays in-memory (broadcast signal, not user-visible).
- `src/components/BloodworkPanelGroup.tsx` (used in the dated view) — same treatment so behavior is consistent if the user visits both views.
- New helper `src/lib/bloodwork-ui-state.ts` with typed `read*`/`write*` functions so both call sites share serialization (especially the `Record<string, boolean>` collapsed map).

Edge cases:
- Wrap all storage access in `try/catch` (matches existing patterns).
- Prune the collapsed map opportunistically: when reading, drop keys whose `panelId` isn't in the current panel list, then write back.
- Active `query` continues to force rows expanded; per-panel state takes over once the query clears.

## 2. Pinned analyte charts section on the panel-type log

When the user expands a panel-type custom log on /custom, show a "Pinned" section above the panel history listing the saved bloodwork charts. Reuses the rendering already used in Trends so visuals stay in sync.

Touchpoints:
- New `src/components/PinnedBloodworkChartsSection.tsx`:
  - Uses `useSavedCharts()` to get saved charts + live specs (same hook Trends uses).
  - Filters to `chart_dsl.source === "bloodwork"`.
  - Receives the panel header's `query` as a prop. When `query` is non-empty, further filter the pinned charts so only charts whose analyte matches the query are shown — match against the chart title, the DSL's `filter.canonicalKey`, and (where available) the analyte's display name / aliases via `src/lib/bloodwork-canonical.ts`. This way, searching for an analyte surfaces both its panel rows and its pinned chart together.
  - Renders inside a `CollapsibleSection` titled "Pinned" with `storageKey="custom-pinned-bloodwork"` (open/closed persists for free).
  - Layout: same `grid grid-cols-2 gap-2` of `<DynamicChart spec={live ?? chart.chart_spec} />` blocks used in Trends.
  - Empty state: render nothing — including when a search query filters all pinned charts out — so we never show an empty "Pinned" header.
- `src/components/CustomLogByTypeView.tsx` — when `logType.value_type === 'panel'`, render `<PinnedBloodworkChartsSection query={panelQuery} />` at the top of the expanded body, above `<PanelHistory />`.
- No backend changes. Pinning/unpinning continues to flow through `usePinnedBloodworkCharts` from `BloodworkPanelRow`; React Query invalidation makes the new section update live.

## Out of scope

- Hover-card / popover variant of the chart (we chose the dedicated section).
- Syncing state across devices (explicitly device-local).
- Changes to Trends rendering of pinned bloodwork charts.
- Persisting other unrelated ephemeral UI (food-log expansions, etc.).

## Memory update

After implementation, add a memory entry `Bloodwork UI Persistence` — keys list + lazy-init + event-handler write pattern, plus the rule that pinned charts honor the header search query.

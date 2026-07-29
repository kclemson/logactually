## Fix

In `src/pages/Trends.tsx`, filter bloodwork-sourced pins out of the "My Charts" section so they only appear under Custom Trends (next to their parent bloodwork context).

## Changes

1. Derive `myCharts = savedCharts.filter(c => (c.chart_dsl as ChartDSL | null)?.source !== "bloodwork")`.
2. Replace the `savedCharts.map(...)` render at line 474 with `myCharts.map(...)`, and update the reorder handler to operate on `myCharts` (map back to the full `savedCharts` order when persisting, so bloodwork pin positions in the underlying list aren't disturbed).
3. Gate the "My Charts" section visibility on `myCharts.length > 0` instead of `savedCharts.length > 0`, so a user with only bloodwork pins doesn't see an empty My Charts header.
4. Leave the Custom Trends bloodwork rendering (line 812) and all pin/unpin logic untouched.

## Not changing

- Database schema — bloodwork pins continue to live in `saved_charts` with `source: "bloodwork"`.
- The pin/unpin flow from bloodwork lists.
- Ask-AI pinned charts (no `source` field) continue to appear in My Charts as before.

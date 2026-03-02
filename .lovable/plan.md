

## Remove dots from line series in dual-series charts

The outline/halo SVG trick works well for the line path itself, but the dots (circles at each data point) break the clean look — they create visual clutter and the outline around each dot doesn't look as polished as the line outline. Since the tooltip already shows the exact value on hover/tap, the dots aren't needed for readability.

### Change

**`src/components/trends/DynamicChart.tsx`** — In both `renderSeriesA()` and `renderSeriesB()`, when rendering a line in dual-series mode (`isDualSeries`), set `dot={false}` on the main colored `Line` component. Keep `activeDot={{ r: 3 }}` so a dot still appears on hover to indicate which point the tooltip refers to. Single-series line charts keep their existing dot behavior unchanged.


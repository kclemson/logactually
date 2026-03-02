

## Add background-colored stroke outline to line series

Recharts' `Line` component doesn't support a native outline/stroke effect, but SVG has a clean trick: render the same line path twice — first as a thicker "shadow" line in the background color, then the actual colored line on top. This creates a halo/knockout effect that makes the line pop over bars.

### Approach

**`DynamicChart.tsx`** — For every `Line` element (both Series A and Series B), render a duplicate "outline" `Line` immediately before it:

- Same `dataKey`, `type`, `connectNulls`, `yAxisId`
- `stroke="hsl(var(--card))"` — uses the card background color from the user's theme (works in both light and dark mode)
- `strokeWidth={4}` (the visible line is 1.5, so a 4px stroke underneath creates a ~1.25px halo on each side)
- `dot={false}`, `activeDot={false}`, `isAnimationActive={false}`, no `LabelList`
- `legendType="none"` and `name=""` so it doesn't appear in tooltips or legends

The actual colored line renders after (on top in SVG z-order) with its existing 1.5px stroke and dots.

This applies to both `renderSeriesA()` and `renderSeriesB()` whenever they produce a Line. The outline line is only added when `isDualSeries` is true (single-series line charts don't need it since there are no bars underneath).

Dots on the colored line also get a subtle outline via the SVG `stroke` property on the `<circle>` — add `stroke="hsl(var(--card))"` and `strokeWidth={1.5}` to the dot render functions.

No other files affected.


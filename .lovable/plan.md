

# Fix clipped X-axis labels on categorical charts

## Problem
On charts grouped by category (like "Average Heart Rate by Exercise"), multi-word labels such as "Indoor bike" are truncated to just "Indoor". The tooltip correctly shows the full name, but the axis label is clipped because the X-axis has a fixed height of 16px and Recharts skips or truncates labels that don't fit.

## Solution
Use a custom tick renderer for the X-axis that wraps long labels into multiple lines (one word per line) when the chart uses categorical grouping. This keeps the compact font size while ensuring all words are visible.

## Technical Details

**File: `src/components/trends/DynamicChart.tsx`**

1. Detect categorical charts: check if `xAxis.field` is something like `label` (non-date grouping) or if `spec.chartType` data contains non-date x values. A simpler heuristic: if the data has a `label` field (categorical DSL uses `label` as the x-axis field), treat it as categorical.

2. For categorical charts, replace the default tick with a custom SVG `<text>` renderer that splits the label on spaces and renders each word as a separate `<tspan>` with a `dy` offset. This produces stacked multi-line labels.

3. Increase the X-axis `height` from 16 to ~28 for categorical charts to accommodate up to 2 lines of text.

4. Set `interval={0}` for categorical charts so no labels are skipped (there are typically few categories).

```
Before: "Indoor" (clipped)
After:  "Indoor"
        "bike"   (two lines, fully visible)
```

| File | Change |
|---|---|
| `src/components/trends/DynamicChart.tsx` | Add custom multi-line tick renderer for categorical X-axis; increase axis height and force interval=0 when categorical |


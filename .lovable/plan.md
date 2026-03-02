

## Ensure Line series always renders above Bar series in dual-series charts

In Recharts, SVG render order determines z-order — elements rendered later appear on top. Currently `renderSeriesA()` is always called before `renderSeriesB()`, so if Series A is a Bar and Series B is a Line, the line renders on top (good). But if Series A is a Line and Series B is a Bar, the bars cover the line (bad — as shown in your second screenshot).

### Change

**`DynamicChart.tsx`** (lines 391-393) — In the `ComposedChart` block, render bars first, then lines, regardless of which is Series A or B:

```tsx
// Instead of fixed order:
//   {renderSeriesA()}
//   {renderSeriesB()}

// Render bars first, lines second:
const aIsLine = chartType === "line";
const bIsLine = secondSeries?.chartType === "line";

// Bars go first (rendered behind), lines go last (rendered in front)
{aIsLine ? renderSeriesB() : renderSeriesA()}
{aIsLine ? renderSeriesA() : renderSeriesB()}
```

If both are the same type (both bars or both lines), order doesn't matter, so the fallback keeps Series A first. This ensures the line is always visually on top of the bars regardless of which series the user assigned each chart type to.

One small change in `DynamicChart.tsx`, no other files affected.



## Fix Clipped Labels at Chart Edges

The rightmost (and sometimes leftmost) numeric labels above bars get clipped because the SVG element defaults to `overflow: hidden`. The "161" in the screenshot is cut off at the right boundary.

### Fix

Add `overflow="visible"` to the `<BarChart>` component in all three chart renderers in `src/components/trends/FoodChart.tsx`:

1. **`FoodChart`** — the `<BarChart>` around line 159
2. **`StackedMacroChart`** — the `<BarChart>` around line 231
3. **`VolumeChart`** — the `<BarChart>` around line 310

Each change is just adding one prop:

```tsx
// Before
<BarChart data={chartData} margin={{ ... }}>

// After
<BarChart data={chartData} margin={{ ... }} overflow="visible">
```

### Technical Details

**File:** `src/components/trends/FoodChart.tsx`

Three `<BarChart>` instances get the `overflow="visible"` prop added. This lets the SVG labels render outside the chart's bounding box without affecting layout or spacing. No other files touched.

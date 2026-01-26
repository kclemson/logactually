

## Remove Horizontal Spacing Between Macro Bars

### Overview
Remove the gap between the Protein/Carbs/Fat bars within each day's group in the Macros (g) chart, so they appear as tightly grouped columns.

---

### Change

**File: `src/pages/Trends.tsx`**

Add `barGap={0}` prop to the BarChart component in the Macros chart.

**Line 222 - Update BarChart:**

Current:
```tsx
<BarChart data={chartData}>
```

New:
```tsx
<BarChart data={chartData} barGap={0}>
```

---

### Technical Details

| Prop | Purpose |
|------|---------|
| `barGap` | Controls the gap between bars in the same category group (default is ~4px) |
| `barGap={0}` | Removes spacing so bars touch each other |

---

### Result
- Protein, Carbs, and Fat bars for each day will be directly adjacent with no gap
- Makes the grouped bars more compact and easier to visually compare as a unit
- Days will still have natural spacing between them via `barCategoryGap` (unchanged)


## Hide time-range subheader on bloodwork charts

Bloodwork charts always show all-time data and ignore the Trends page period selector, so the "Last 90 days · v2" subheader is misleading.

### Change

In `src/pages/Trends.tsx` (line ~726-731), when rendering `DynamicChart` for bloodwork charts, omit both `period` and `timeRangeSuffix` props. With both undefined, `DynamicChart` already renders `timeRange=""` (the `.filter(Boolean).join(" ")` collapses to empty), so the subtitle row disappears.

```tsx
<DynamicChart
  key={chart.id}
  spec={spec}
  // no period, no timeRangeSuffix → no subheader
/>
```

No changes to `DynamicChart`, the `ChartCard` subtitle logic, or custom-log trends.
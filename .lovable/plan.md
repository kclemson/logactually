

## Fix: Desktop click-to-navigate broken on Line charts

### Root cause

The `<Bar>` component has an `onClick` handler (line 276) that calls `interaction.handleBarClick`, which navigates on desktop. But the `<Line>` component (line 245) has **no onClick handler at all**. So clicking a data point on a line chart does nothing — the click falls through to the tooltip wrapper (which has `pointerEvents: "auto"`), causing text selection.

### Fix

**File: `src/components/trends/DynamicChart.tsx`**

Add an `onClick` handler to the `<LineChart>` component itself (since individual `<Line>` doesn't support `onClick` the same way `<Bar>` does). Recharts `<LineChart>` accepts an `onClick` prop that receives the chart event with `activePayload` and `activeTooltipIndex`.

```typescript
// Add onClick to <LineChart> (around line 232)
<LineChart
  data={chartData}
  margin={{ top: 16, right: 4, left: 0, bottom: 0 }}
  onClick={(state: any) => {
    if (state?.activeTooltipIndex != null && state?.activePayload?.[0]?.payload) {
      interaction.handleBarClick(state.activePayload[0].payload, state.activeTooltipIndex);
    }
  }}
>
```

Also add the same `onClick` to `<BarChart>` for consistency (currently it relies on the `<Bar>` onClick, but having it at chart level is more robust). Actually, `<Bar>` onClick already works, so we only need to add it to `<LineChart>`.

Additionally, add `user-select: none` to the tooltip wrapper to prevent text selection on click:

```typescript
// In sharedTooltipProps.wrapperStyle (line 169)
wrapperStyle: { pointerEvents: "auto" as const, zIndex: 50, userSelect: "none" as const },
```

### Summary

| File | Change |
|------|--------|
| `src/components/trends/DynamicChart.tsx` | Add `onClick` to `<LineChart>` for navigation; add `userSelect: "none"` to tooltip wrapper |


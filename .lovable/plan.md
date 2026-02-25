

## Fix: Categorical X-axis labels overlapping tick marks

The `MultiLineTick` component renders label text starting at the exact `y` position passed by Recharts, which is the same position as the tick line. For categorical charts (like "Average Heart Rate by Exercise"), the multi-word labels (e.g., "Running", "Indoor") overlap the vertical tick marks beneath each bar.

**Fix in `src/components/trends/DynamicChart.tsx`**: Shift the first `tspan` down by adding a `dy` offset so the text clears the tick mark.

```typescript
// Before (line 31):
<tspan x={x} dy={i === 0 ? 0 : 10} key={i}>{w}</tspan>

// After:
<tspan x={x} dy={i === 0 ? 4 : 10} key={i}>{w}</tspan>
```

A 4px downward nudge on the first line gives enough clearance from the tick mark while keeping the label compact. Single-word labels (like "Running" or "Walking") also benefit since they currently sit right on the tick line.

One file, one number change.



## Fix Weight Chart Label Visibility - Debug and Correct Approach

The current fix broke labels because Recharts' `LabelList` content function receives props differently than expected.

---

### Root Cause

When using `<LabelList dataKey="label" content={renderGroupedLabel} />`, Recharts passes these props to the content function:

```typescript
{
  x, y, width, height,
  value,        // The value from dataKey="label" (e.g., "3×10×160")
  index,        // The index of the data point
  ...otherProps // May include the full data object spread or as a property
}
```

The issue is that `showLabel` is a custom property we added to the chart data, but Recharts may not pass the entire data object under `payload`. Instead, the full data point is likely available:
1. Directly on `props` (spread), or
2. Under a different property like `entry` or as individual props

---

### Solution

Access `showLabel` using the `index` prop to look it up from the original data, OR check if it's passed directly on props rather than under `payload`.

**Option 1 - Check if showLabel is on props directly:**
```tsx
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value, showLabel } = props;

  // Check showLabel directly on props
  if (!showLabel) return null;
  
  // ... rest of rendering
};
```

**Option 2 - Pass a data accessor (more reliable):**
Since `ExerciseChart` creates `chartData` in a `useMemo`, we can pass it to `renderGroupedLabel` via closure by converting it to an inline function that has access to `chartData`.

---

### Recommended Fix

Change the approach to use an inline content function that has access to `chartData`:

```tsx
const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const chartData = useMemo(() => {
    // ... existing logic
  }, [exercise.weightData]);

  // Move renderGroupedLabel INSIDE the component as a callback
  const renderLabel = (props: any) => {
    const { x, y, width, height, value, index } = props;
    
    // Access showLabel from chartData using index
    const dataPoint = chartData[index];
    if (!dataPoint?.showLabel) return null;

    // ... rest of rendering logic
  };

  return (
    // ...
    <LabelList dataKey="label" content={renderLabel} />
  );
};
```

---

### Files to Modify

**src/pages/Trends.tsx**

1. Remove the standalone `renderGroupedLabel` function (lines 52-94)
2. Move the label rendering logic inside `ExerciseChart` component as an inline function or callback that has access to `chartData`
3. Use `index` prop to look up the `showLabel` value from `chartData[index]`

---

### Why This Will Work

- The `index` prop is reliably passed by Recharts to `LabelList` content functions
- By keeping `renderLabel` inside `ExerciseChart`, we have closure access to `chartData`
- We can then use `chartData[index].showLabel` to determine visibility

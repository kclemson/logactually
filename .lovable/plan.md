

## Add Interval-Based Labels to Food and Total Volume Charts

### Problem
The user correctly identified that:
1. **Total Training Volume chart** - Has no interval-based label logic at all; it shows every label unconditionally
2. **Food charts** - While the logic exists in code, it may not be rendering correctly with the current implementation

Looking at the code:
- Food charts use `createFoodLabelRenderer` which checks `showLabel` - this should work, but the labels appear crowded in the screenshot
- Total Volume chart uses a plain `<LabelList>` without any interval logic

---

### Technical Changes

#### 1. Fix Total Training Volume Chart (lines 544-584)

Add `showLabel` calculation to `volumeByDay` and use a custom label renderer similar to the food charts.

**Update the `volumeByDay` calculation (around lines 284-306):**

Add interval-based `showLabel` to each data point:

```tsx
const volumeByDay = useMemo(() => {
  // ... existing byDate aggregation ...
  
  const entries = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, volumeLbs]) => {
      const volume = settings.weightUnit === "kg" 
        ? Math.round(volumeLbs * LBS_TO_KG) 
        : Math.round(volumeLbs);
      return {
        date: format(new Date(`${date}T12:00:00`), "MMM d"),
        volume,
        label: `${Math.round(volume / 1000)}k`,
      };
    });

  // Add showLabel based on interval
  const dataLength = entries.length;
  const labelInterval = dataLength <= 12 ? 1 : dataLength <= 20 ? 2 : 3;
  
  return entries.map((d, index) => ({
    ...d,
    showLabel: index % labelInterval === 0 || index === dataLength - 1,
  }));
}, [weightExercises, settings.weightUnit]);
```

**Update the Total Volume chart's LabelList (lines 571-577):**

Replace the plain `LabelList` with a custom content renderer that respects `showLabel`:

```tsx
<LabelList 
  dataKey="label" 
  content={(props: any) => {
    const { x, y, width, value, index } = props;
    const dataPoint = volumeByDay[index];
    if (!dataPoint?.showLabel) return null;
    if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
    
    return (
      <text
        x={x + width / 2}
        y={y - 4}
        fill={CHART_COLORS.trainingVolume}
        textAnchor="middle"
        fontSize={7}
        fontWeight={500}
      >
        {value}
      </text>
    );
  }}
/>
```

---

### Result
- Total Training Volume chart will show labels every N columns based on the data count threshold (≤12: every column, 13-20: every 2nd, >20: every 3rd)
- Last column always shows its label
- Consistent behavior across all charts on the Trends page


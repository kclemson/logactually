

## Add Volume Labels with "k" Format

### Overview

Add labels above each bar in the Total Volume chart, formatted to show thousands (e.g., "18k" instead of "18010").

---

### File to Modify

**`src/pages/Trends.tsx`**

---

### Change 1: Add a Label Formatter Helper

Add a simple function to format large numbers to "Xk" format:

```typescript
const formatVolumeLabel = (value: number) => {
  return `${Math.round(value / 1000)}k`;
};
```

---

### Change 2: Update volumeByDay to include formatted label

Modify the `volumeByDay` memo to add a `label` field:

```typescript
.map(([date, volumeLbs]) => {
  const volume = settings.weightUnit === "kg" 
    ? Math.round(volumeLbs * LBS_TO_KG) 
    : Math.round(volumeLbs);
  return {
    date: format(new Date(`${date}T12:00:00`), "MMM d"),
    volume,
    label: `${Math.round(volume / 1000)}k`,
  };
})
```

---

### Change 3: Add LabelList to the Volume Bar

Add `LabelList` import usage and increase top margin for labels:

```tsx
<BarChart data={volumeByDay} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
  {/* ... XAxis and Tooltip ... */}
  <Bar dataKey="volume" fill={CHART_COLORS.trainingVolume} radius={[2, 2, 0, 0]}>
    <LabelList 
      dataKey="label" 
      position="top" 
      fill={CHART_COLORS.trainingVolume}
      fontSize={7}
      fontWeight={500}
    />
  </Bar>
</BarChart>
```

---

### Summary

| Change | Details |
|--------|---------|
| Label format | Volume shown as "18k" not "18010" |
| Label position | Above each bar using `position="top"` |
| Label styling | Same purple color as bar, 7px font, 500 weight |
| Top margin | Increased to 12px to make room for labels |


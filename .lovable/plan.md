

## Simplify Weight Chart Labels with Threshold-Based Visibility

When weight charts have many columns, simplify the display by only showing labels on every Nth bar, while keeping full details accessible via hover tooltip.

---

### Current Problem

1. **Label overload**: When charts have many columns (like the Lat Pulldown with 20+ bars), every bar shows sets/reps/weight labels, creating visual clutter
2. **Incomplete tooltips**: Hovering only shows "Weight: X lbs" but not sets and reps

---

### Solution

**Part 1: Threshold-based label visibility**
- If a chart has more than N columns (e.g., 8), only show labels on every Xth column
- Suggested thresholds:
  - 1-8 columns: Show all labels
  - 9-16 columns: Show labels on every 2nd column
  - 17+ columns: Show labels on every 3rd column
- Pass the column index and total count to the label renderer so it can decide whether to render

**Part 2: Enhanced tooltip with sets/reps**
- Update the tooltip formatter for weight charts to show all three values: sets, reps, and weight
- Format: "3 sets × 10 reps @ 70 lbs" or similar

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Update `renderGroupedLabel` to accept column count and conditionally render; Update tooltip formatter to include sets/reps |

---

### Technical Approach

**1. Modify ExerciseChart to calculate label interval:**

```tsx
const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const chartData = useMemo(() => {
    const dataLength = exercise.weightData.length;
    // Calculate how often to show labels
    const labelInterval = dataLength <= 8 ? 1 : dataLength <= 16 ? 2 : 3;
    
    return exercise.weightData.map((d, index) => ({
      ...d,
      dateLabel: format(new Date(`${d.date}T12:00:00`), 'MMM d'),
      label: `${d.sets}×${d.reps}×${d.weight}`,
      showLabel: index % labelInterval === 0 || index === dataLength - 1,
    }));
  }, [exercise.weightData]);
  // ...
}
```

**2. Update renderGroupedLabel to respect showLabel flag:**

```tsx
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value, payload } = props;
  
  // Skip rendering if showLabel is false
  if (!payload?.showLabel) return null;
  
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  // ... rest of existing logic
};
```

**3. Update tooltip formatter to show all details:**

```tsx
<Tooltip
  content={<CompactTooltip formatter={(value: number, name: string, entry: any) => {
    const { sets, reps, weight } = entry.payload;
    return `${sets} sets × ${reps} reps @ ${weight} lbs`;
  }} />}
  // ...
/>
```

---

### Visual Result

- **Sparse charts** (≤8 columns): All labels visible as before
- **Medium charts** (9-16 columns): Labels on every 2nd bar, plus the last bar
- **Dense charts** (17+ columns): Labels on every 3rd bar, plus the last bar
- **Tooltips**: Always show full details (sets, reps, weight) on hover for any bar

---

### Edge Cases Handled

1. **Always show last column**: Even with intervals, the last bar always gets a label so users can see the most recent data
2. **All data in tooltip**: Regardless of label visibility, hovering shows complete information
3. **Small charts unaffected**: Charts with few columns continue to show all labels


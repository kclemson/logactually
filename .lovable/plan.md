

## Fix Weight Trend Labels: First Occurrence Only

The current approach has been failing because of confusion about how Recharts passes custom data to the `LabelList` content function. Rather than debugging that further, we'll take a simpler approach that aligns with your preference: **show the label only on the first occurrence of each unique `sets×reps×weight` combination**.

---

### How The New Logic Works

Instead of computing "middle of run" (which requires knowing run boundaries), we compute a simple `showLabel: boolean` during data preparation:

```text
chartData: [
  { date: "Jan 4",  label: "3×10×70", weight: 70, showLabel: true },   ← first "3×10×70"
  { date: "Jan 8",  label: "3×10×70", weight: 70, showLabel: false },  ← already seen
  { date: "Jan 15", label: "3×10×80", weight: 80, showLabel: true },   ← first "3×10×80"
  { date: "Jan 21", label: "3×10×70", weight: 70, showLabel: false },  ← already seen
  { date: "Jan 24", label: "3×10×80", weight: 80, showLabel: false },  ← already seen
  ...
]
```

This is computed during the `chartData.map()` by tracking seen labels in a `Set`.

---

### Changes to `src/pages/Trends.tsx`

#### 1. Simplify `renderGroupedLabel`

Replace the complex run-detection logic with a simple check:

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, value } = props;
  const payload = props.payload;
  
  // Only render if this is the first occurrence of this label
  if (!payload?.showLabel || !value) return null;
  
  // Guard against NaN coordinates
  if (typeof x !== 'number' || typeof width !== 'number') return null;
  
  return (
    <text
      x={x + width / 2}
      y={y + 10}
      fill="#FFFFFF"
      textAnchor="middle"
      fontSize={7}
      fontWeight={500}
    >
      {value}
    </text>
  );
};
```

#### 2. Simplify `ExerciseChart` data preparation

Replace the run-detection logic with first-occurrence tracking:

```typescript
const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const chartData = useMemo(() => {
    const seenLabels = new Set<string>();
    
    return exercise.weightData.map((d) => {
      const label = `${d.sets}×${d.reps}×${d.weight}`;
      const showLabel = !seenLabels.has(label);
      
      if (showLabel) {
        seenLabels.add(label);
      }
      
      return {
        ...d,
        dateLabel: format(new Date(d.date), 'MMM d'),
        label,
        showLabel,
      };
    });
  }, [exercise.weightData]);

  // ... rest unchanged
};
```

---

### Why This Will Work

| Problem with old approach | Why new approach avoids it |
|---------------------------|---------------------------|
| Complex `isRunMiddle` logic that required precise index math | Simple boolean computed during data prep |
| Uncertainty about `props.payload` structure | We still access `payload.showLabel`, but now it's a simple boolean check |
| Multiple things that could silently fail | Only one check: `if (!payload?.showLabel)` |
| Hard to debug | Easy to verify: log `chartData` and see which items have `showLabel: true` |

---

### Files to Modify

| File | Section | Change |
|------|---------|--------|
| `src/pages/Trends.tsx` | Lines 57-89 | Replace `renderGroupedLabel` with simplified version |
| `src/pages/Trends.tsx` | Lines 91-124 | Replace `ExerciseChart` chartData logic with first-occurrence tracking |

---

### Expected Result

Each Weight Trends chart will show:
- A **white label** (e.g., "3×10×70") on the **first bar** where that combination appears
- **No label** on subsequent bars with the same combination
- Different combinations each get their own first-occurrence label

This matches the "Lat Pulldown" chart in your screenshot: if bars 1-4 are all "3×10×70", only bar 1 shows the label. If bar 5 is "3×10×80", bar 5 shows that label.


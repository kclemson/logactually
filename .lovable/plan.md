

## Grouped Labels for Weight Trends Charts

Display a single spanning label across consecutive bars with identical sets×reps×weight values, reducing clutter and highlighting progress points.

---

### How It Works

```text
CURRENT (every bar labeled):
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│3×10│3×10│3×10│3×10│3×10│3×10│
│×140│×140│×140│×140│×160│×160│  ← Cluttered, hard to read
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘

NEW (grouped spanning labels):
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│         3×10×140        │  3×10×160 │  ← Clean, shows progression
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
```

---

### Implementation Approach

**Step 1: Identify "runs" of consecutive identical labels**

During chart data preparation, detect consecutive bars with matching `sets×reps×weight` values and mark them as belonging to the same group.

**Step 2: Calculate group metadata**

For each bar, store:
- `runIndex`: Which position in its run (0, 1, 2...)
- `runLength`: Total bars in this run
- `isRunStart`: Is this the first bar in a run?
- `isRunEnd`: Is this the last bar in a run?

**Step 3: Render label only on the middle bar of each run**

The custom label renderer will:
- Skip rendering for non-middle bars in a run
- For runs with even length, use the first of the two middle bars
- Calculate the spanning width based on run length

---

### Data Structure Enhancement

```typescript
// Enhanced chart data item
interface ChartDataPoint {
  // Existing fields
  date: string;
  weight: number;
  sets: number;
  reps: number;
  dateLabel: string;
  label: string;
  
  // NEW: Run metadata for grouped labels
  runIndex: number;      // Position in current run (0-based)
  runLength: number;     // Total bars in this run
  isRunMiddle: boolean;  // Should this bar render the spanning label?
}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Add run detection logic and update label renderer |

---

### Run Detection Algorithm

```typescript
// In ExerciseChart component
const chartData = exercise.weightData.map((d, i, arr) => {
  const label = `${d.sets}×${d.reps}×${d.weight}`;
  
  // Find the start of this run (look backward)
  let runStart = i;
  while (runStart > 0) {
    const prev = arr[runStart - 1];
    if (`${prev.sets}×${prev.reps}×${prev.weight}` !== label) break;
    runStart--;
  }
  
  // Find the end of this run (look forward)
  let runEnd = i;
  while (runEnd < arr.length - 1) {
    const next = arr[runEnd + 1];
    if (`${next.sets}×${next.reps}×${next.weight}` !== label) break;
    runEnd++;
  }
  
  const runLength = runEnd - runStart + 1;
  const runIndex = i - runStart;
  const middleIndex = Math.floor((runLength - 1) / 2);
  
  return {
    ...d,
    dateLabel: format(new Date(d.date), 'MMM d'),
    label,
    runIndex,
    runLength,
    isRunMiddle: runIndex === middleIndex,
  };
});
```

---

### Updated Label Renderer

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, height, value, payload } = props;
  
  // Only render for the middle bar of each run
  if (!payload?.isRunMiddle || !value || height < 12) return null;
  
  const { runLength } = payload;
  
  // Calculate spanning width (bar width × run length + gaps)
  // The label will visually span across all bars in the run
  const spanWidth = width * runLength + (runLength - 1) * 4; // 4px assumed gap
  const spanX = x - (payload.runIndex * (width + 4)); // Offset to center across run
  
  return (
    <text
      x={spanX + spanWidth / 2}
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

---

### Visual Benefits

1. **Reduced Clutter**: One label per plateau instead of per bar
2. **Progress Visibility**: Easy to spot when values change (new label = progress!)
3. **Scalable**: Works well for 7-day, 30-day, and 90-day views
4. **Maintainable**: Simple algorithm with clear logic

---

### Edge Cases Handled

- Single-bar runs: Label renders normally on that bar
- Different weights same day: Already separate bars, will be in different runs
- Very long runs (90-day view): Label still centered, no repetition
- Short bars (height < 12): Labels hidden to prevent overflow


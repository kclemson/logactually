

## Restore Labels on Every Bar, Then Implement First-Occurrence

Given that multiple attempts to fix the label rendering have failed, I recommend a two-step approach:

### Step 1: Get Labels Working Again (Every Bar)

**Strategy:** Remove all conditional logic and just render every label unconditionally. This establishes a working baseline.

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, value } = props;
  
  // Guard against invalid values
  if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
  
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

**Remove** the `showLabel` logic from chartData - just keep it simple:

```typescript
const chartData = useMemo(() => {
  return exercise.weightData.map((d) => ({
    ...d,
    dateLabel: format(new Date(d.date), 'MMM d'),
    label: `${d.sets}×${d.reps}×${d.weight}`,
  }));
}, [exercise.weightData]);
```

---

### Step 2: Add First-Occurrence Logic (After Step 1 Works)

Once labels are confirmed working, implement first-occurrence using a `useRef` to track seen labels **across the render cycle**:

```typescript
const ExerciseChart = ({ exercise }: { exercise: ExerciseTrend }) => {
  const seenLabelsRef = useRef<Set<string>>(new Set());
  
  // Reset on data change
  useEffect(() => {
    seenLabelsRef.current.clear();
  }, [exercise.weightData]);

  const chartData = useMemo(() => {
    return exercise.weightData.map((d) => ({
      ...d,
      dateLabel: format(new Date(d.date), 'MMM d'),
      label: `${d.sets}×${d.reps}×${d.weight}`,
    }));
  }, [exercise.weightData]);

  // Custom render that tracks first occurrence
  const renderLabel = useCallback((props: any) => {
    const { x, y, width, value } = props;
    
    if (!value || typeof x !== 'number' || typeof width !== 'number') return null;
    
    // Check if we've seen this label before
    if (seenLabelsRef.current.has(value)) {
      return null; // Skip duplicates
    }
    seenLabelsRef.current.add(value);
    
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
  }, []);

  // ... rest of component
};
```

---

### Why This Approach Is Better

| Previous Approach | New Approach |
|-------------------|--------------|
| Pre-computed `showLabel` boolean in data | Track during render using `useRef` |
| Relied on Recharts passing `payload.showLabel` correctly | Only relies on `value` which we know works |
| Complex conditional logic before we verified basics | Step-by-step: first confirm rendering, then add logic |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/Trends.tsx` | Lines 57-79: Simplify `renderGroupedLabel` to remove conditional |
| `src/pages/Trends.tsx` | Lines 81-101: Move `renderLabel` inside component, use `useRef` for first-occurrence tracking |

---

### Implementation Order

1. **First commit**: Remove all `showLabel` logic, render every label
2. **Verify**: Confirm labels appear on all bars
3. **Second commit**: Add `useRef`-based first-occurrence tracking
4. **Verify**: Confirm only first occurrence of each label shows


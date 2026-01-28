

## Fix Default Period and Missing Weight Labels

Two changes needed to fix the reported issues.

---

### Issue #1: Default View Should Be 30 Days

**Current code (line 161):**
```typescript
const [selectedPeriod, setSelectedPeriod] = useState(7);
```

**Fix:** Change to `useState(30)`

---

### Issue #2: Sets×Reps×Weight Labels Not Showing

The labels aren't appearing because the custom properties (`isRunMiddle`, `runLength`, `runIndex`) aren't being accessed correctly from the Recharts props.

**Root Cause:** In Recharts `LabelList` with `content`, the data point properties are spread directly into props - not nested inside `payload`. The current code checks `payload?.isRunMiddle`, but it should check `props` directly OR the properties might be nested differently.

**Diagnosis approach:** Looking at Recharts documentation and examples, when using `LabelList` on a `Bar`, the props passed to the custom content function include:
- `x`, `y`, `width`, `height` - positioning
- `value` - the value from `dataKey`
- The data entry properties are accessible directly in props

**Fix:** Access the custom properties directly from props instead of from `payload`:

```typescript
const renderGroupedLabel = (props: any) => {
  const { x, y, width, value, isRunMiddle, runLength, runIndex } = props;
  
  // Only render for the middle bar of each run
  if (!isRunMiddle || !value) return null;
  
  // Calculate spanning width
  const barGap = 4;
  const spanWidth = width * runLength + (runLength - 1) * barGap;
  const spanX = x - (runIndex * (width + barGap));
  
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

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/Trends.tsx` | 161 | Change `useState(7)` to `useState(30)` |
| `src/pages/Trends.tsx` | 57-81 | Update `renderGroupedLabel` to access props directly |

---

### Summary of Changes

1. **Line 161:** `useState(30)` for 30-day default
2. **Lines 57-81:** Destructure `isRunMiddle`, `runLength`, `runIndex` directly from props instead of from `payload`


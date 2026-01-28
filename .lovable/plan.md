
## Fix Weight Label Clipping with Chart Top Margin

The weight labels (e.g., "160") that appear above the bars are getting clipped because the chart area doesn't have padding at the top to accommodate them.

---

### Solution: Add Top Margin to BarChart

Recharts `BarChart` accepts a `margin` prop that adds internal padding. By adding a top margin, we create space for the weight labels above the tallest bars.

---

### Changes to `src/pages/Trends.tsx`

Update `ExerciseChart` component (line 135):

```typescript
<BarChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
```

---

### Why 12px Top Margin?

| Element | Height |
|---------|--------|
| Weight label font size | 7px |
| Space above bar (`y - 4`) | 4px |
| Buffer for descenders | ~1-2px |
| **Total** | ~12px |

This ensures even the tallest bars have room for their weight labels without being clipped.

---

### Visual Result

Before:
```
┌─────────────────────┐
│    [clipped "160"]  │  ← label cut off
│ ██████████████████  │
│ ██████████████████  │
└─────────────────────┘
```

After:
```
┌─────────────────────┐
│        160          │  ← label visible
│ ██████████████████  │
│ ██████████████████  │
└─────────────────────┘
```

---

### File to Modify

| File | Line | Change |
|------|------|--------|
| `src/pages/Trends.tsx` | 135 | Add `margin={{ top: 12, right: 0, left: 0, bottom: 0 }}` to `<BarChart>` |

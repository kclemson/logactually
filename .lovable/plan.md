

## Add Weight to Column Labels in Weight Trends Charts

Update the label format on each bar from "sets×reps" to "sets×reps×weight" for complete information at a glance.

---

### Current vs New Label Format

| Current | New |
|---------|-----|
| `2×10` | `2×10×60` |
| `1×10` | `1×10×70` |

---

### File to Modify

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Update label format in `ExerciseChart` component |

---

### Change Details

In the `ExerciseChart` component, update the `chartData` mapping (around line 87):

**Current:**
```typescript
label: `${d.sets}×${d.reps}`,
```

**New:**
```typescript
label: `${d.sets}×${d.reps}×${d.weight}`,
```

---

### Visual Result

```text
Lat Pulldown (Max: 70 lbs)
┌────────┐  ┌────────┐
│2×10×60 │  │1×10×70 │
│        │  │        │
│        │  │████████│
│████████│  │████████│
└────────┘  └────────┘
   Jan 27      Jan 27
```

The label now shows the complete workout info: sets × reps × weight in one compact string.


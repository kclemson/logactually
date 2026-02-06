

## Fix: Hybrid "Sets × Reps" Display for Varying Rep Counts

### Problem

When you do sets with different rep counts (10, 5, 7), the chart currently shows `3×22` which implies "3 sets of 22 reps each". But the actual meaning is "3 sets totaling 22 reps".

### Your Solution

- **Consistent reps** (3 sets of 10): Keep showing `3×10` ✓
- **Varying reps** (10, 5, 7): Show `1×22` (collapse to "1 set of 22 total reps")

---

### Implementation

**File 1: `src/hooks/useWeightTrends.ts`**

Add `repsPerSet` to track whether reps are uniform:

```typescript
export interface WeightPoint {
  // ... existing fields
  repsPerSet?: number;  // NEW: undefined if reps vary, number if consistent
}
```

During aggregation, track uniformity:
- First set added: store `repsPerSet = row.reps` (assuming sets=1 per row from DB)
- Merging sets: if new entry's reps differs, set `repsPerSet = undefined`

**File 2: `src/pages/Trends.tsx`**

Update bar label (around line 199):

```typescript
// Current:
label: `${d.sets}×${d.reps}`

// Fixed:
label: d.repsPerSet !== undefined 
  ? `${d.sets}×${d.repsPerSet}`   // Uniform: "3×10"
  : `1×${d.reps}`                  // Varying: "1×22"
```

Update tooltip (around line 369):

```typescript
// Current:
return `${sets} sets × ${reps} reps @ ${weight} ${unit}`;

// Fixed:
return repsPerSet !== undefined
  ? `${sets} sets × ${repsPerSet} reps @ ${weight} ${unit}`  // "3 sets × 10 reps"
  : `${sets} sets, ${reps} total reps @ ${weight} ${unit}`;  // "3 sets, 22 total reps"
```

---

### Corrected Edge Cases

| Scenario | Sets | Reps | repsPerSet | Label | Tooltip |
|----------|------|------|------------|-------|---------|
| 3×10 uniform | 3 | 30 | 10 | `3×10` | "3 sets × 10 reps @ 135 lbs" |
| 10+5+7 varying | 3 | 22 | undefined | `1×22` | "3 sets, 22 total reps @ 135 lbs" |
| Single "3×8" entry | 3 | 24 | 8 | `3×8` | "3 sets × 8 reps @ 135 lbs" |
| Two "3×10" entries | 6 | 60 | 10 | `6×10` | "6 sets × 10 reps @ 135 lbs" |

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useWeightTrends.ts` | Add `repsPerSet` to `WeightPoint`, track uniformity during aggregation |
| `src/pages/Trends.tsx` | Use `repsPerSet` for label + tooltip display logic |


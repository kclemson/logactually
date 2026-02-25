

## Fix: Categorical charts misaligned with row neighbors

The chart container is a fixed `h-24` (96px) for all charts. Categorical charts (like "Average Heart Rate by Exercise" and "Distance Walked vs Run") have a taller XAxis (`height: 28` vs `height: 16` for date charts — a 12px difference). Since the total container height is the same, the bars get squeezed shorter, causing visual misalignment with adjacent date-based charts in the same grid row.

### Fix

**File: `src/components/trends/DynamicChart.tsx`, line 230**

Make the container height conditional — categorical charts get the extra 12px:

```typescript
// Before:
<div className="h-24">

// After:
<div className={isCategorical ? "h-[108px]" : "h-24"}>
```

This gives categorical charts 108px total (96 + 12), so the actual bar/plotting area remains the same size as date-based charts. The rows align because the bars are the same height — the extra container space accommodates the taller axis labels.

One file, one line.


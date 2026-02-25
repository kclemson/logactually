

## Fix: Blank gap below categorical charts

### Problem
The `sharedXAxisProps` sets `height: 28` for categorical charts vs `height: 16` for date charts. Both render inside the same `h-24` (96px) container. The extra 12px of XAxis height means:
1. The actual bar plotting area is 12px shorter in categorical charts → bars look shorter than their date-based neighbors → **misalignment**
2. The XAxis reserves 28px but single-word labels (Running, Pool, Walking) only need ~14-16px → **visible blank gap** between the axis and the AI note

### Fix

**File: `src/components/trends/DynamicChart.tsx`, line 190**

Reduce categorical XAxis height from 28 to 20. Single-word labels need ~12px (8px font + 4px dy offset). Two-word labels need ~22px but are rare — 20px is a good compromise that eliminates most of the gap while still fitting typical labels.

```typescript
// Before:
height: isCategorical ? 28 : 16,

// After:
height: isCategorical ? 20 : 16,
```

This reduces the height difference from 12px to 4px, which:
- Nearly eliminates the visible blank gap below categorical charts
- Makes the bar plotting area only 4px shorter than date charts (visually negligible)
- Still provides enough room for single-word and most two-word categorical labels

One line, one file.


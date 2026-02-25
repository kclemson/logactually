

## Fix: Blank space below categorical charts

### Problem

The `h-[108px]` we added for categorical charts makes the chart container 12px taller than date-based charts. This extra height creates visible blank space between the chart and the AI note below it. It also makes the card taller than its row neighbor, which defeats the original alignment goal — CSS grid stretches the row to fit the tallest card, leaving the shorter neighbor with dead space too.

### Fix

Revert to `h-24` for all charts. The cards will have identical heights, so they align perfectly in their grid row. Categorical charts will have slightly shorter bars (because their XAxis labels are taller), but this is visually acceptable and eliminates the blank gap.

**File: `src/components/trends/DynamicChart.tsx`, line 230**

```typescript
// Before:
<div className={isCategorical ? "h-[108px]" : "h-24"}>

// After:
<div className="h-24">
```

One line change.




# Tooltip Layout Overhaul

## Summary of all changes

### 1. Daily tooltip: remove header row, move label to equation result
Remove the `intake / target [dot] daily calorie target` line (line 252-254). Append "daily calorie target" to the equation result line instead. Remove the dot from that result line (since the dot compares intake vs target, and intake is no longer shown in tooltip).

### 2. Remove dots from daily tooltip entirely
The colored dot no longer appears in the tooltip body (only on the calendar cell).

### 3. Force daily tooltip below the trigger
Add `side="bottom"` to both desktop (line 448) and mobile (line 462) `TooltipContent` elements.

### 4. Move legend to top of both tooltips
- Daily tooltip: move the legend block (lines 270-274) to right after the `dayLabel` div, before the equation grid.
- Rollup tooltip: move the legend block (lines 88-92) to the top of the tooltip content div.

### 5. Match legend font size across both tooltips
The daily tooltip legend currently uses `text-[9px]` but the rollup tooltip legend has no size class (inherits default tooltip size). To match them, remove `text-[9px]` from the daily legend so both use the default tooltip font size.

## Technical Details

### File: `src/pages/History.tsx` (buildDayTooltip, lines 248-276)

Current structure:
```
dayLabel
intake / target [dot] daily calorie target   <-- REMOVE
equation grid (opacity-75)
border-t: target [dot]                        <-- change to: target daily calorie target (no dot)
legend (text-[9px])                           <-- move to top, remove text-[9px]
```

New structure:
```
dayLabel
legend (no text-[9px], matches rollup)        <-- moved here
equation grid (opacity-75)
border-t: target daily calorie target         <-- no dot
```

Also add `side="bottom"` to both `TooltipContent` on lines 448 and 462.

### File: `src/components/CalorieTargetRollup.tsx` (lines 79-92)

Current structure:
```
equation blocks
border-t legend
```

New structure:
```
legend (no border-t)
equation blocks
```

### Files Changed
- `src/pages/History.tsx`
- `src/components/CalorieTargetRollup.tsx`


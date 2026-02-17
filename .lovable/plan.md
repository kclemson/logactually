

# Align legend dots vertically using CSS grid

## Change in `src/components/CalorieTargetTooltipContent.tsx`

Replace the current inline `<div>` rows with a CSS grid that has fixed columns, so each dot and its threshold text align vertically between the daily and weekly rows.

### Layout

```text
daily:   ● ≤2.5%   ● ≤10%   ● >10%
weekly:  ● under   ● ≤5%    ● >5%
```

The grid will use 7 columns: `[label] [dot] [threshold] [dot] [threshold] [dot] [threshold]`

### Technical detail

Replace lines 27-40 with:

```tsx
<div className="text-[10px] tabular-nums grid grid-cols-[auto_auto_auto_auto_auto_auto_auto] gap-x-1.5 items-center">
  <div>daily:</div>
  <span className="text-green-400">●</span>
  <div>≤2.5%</div>
  <span className="text-amber-400">●</span>
  <div>≤10%</div>
  <span className="text-rose-400">●</span>
  <div>&gt;10%</div>
  {weekRollup && weekLabel && (
    <>
      <div>weekly:</div>
      <span className="text-green-400">●</span>
      <div>under</div>
      <span className="text-amber-400">●</span>
      <div>≤5%</div>
      <span className="text-rose-400">●</span>
      <div>&gt;5%</div>
    </>
  )}
</div>
```

This keeps the row-based reading order (daily first, weekly second) while ensuring all three colored dots align vertically between the two rows.


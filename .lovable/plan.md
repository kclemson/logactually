

# Combine dots and thresholds into single grid cells

## Change in `src/components/CalorieTargetTooltipContent.tsx`

Merge each colored dot and its threshold label into a single grid cell, reducing the grid from 7 columns to 4: `[label] [green+threshold] [amber+threshold] [rose+threshold]`.

### Result

```text
daily:   ● ≤2.5%   ● ≤10%   ● >10%
weekly:  ● under   ● ≤5%    ● >5%
```

Same visual, but the dot-to-text spacing is now just a normal space character inside one `<span>`, so there's no grid gap to fight with.

### Technical detail

Replace the current 7-column grid (lines ~27-48) with:

```tsx
<div className="text-[10px] tabular-nums grid grid-cols-[auto_auto_auto_auto] gap-x-2 items-center">
  <div>daily:</div>
  <div><span className="text-green-400">●</span> ≤2.5%</div>
  <div><span className="text-amber-400">●</span> ≤10%</div>
  <div><span className="text-rose-400">●</span> &gt;10%</div>
  {weekRollup && weekLabel && (
    <>
      <div>weekly:</div>
      <div><span className="text-green-400">●</span> under</div>
      <div><span className="text-amber-400">●</span> ≤5%</div>
      <div><span className="text-rose-400">●</span> &gt;5%</div>
    </>
  )}
</div>
```

The `gap-x-2` now only controls spacing between the four logical columns (label, green, amber, rose), while dot-to-text spacing within each cell is just a single space character -- no padding to fight with.


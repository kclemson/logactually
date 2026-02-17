
# Switch legend from columns to rows

## Change in `src/components/CalorieTargetTooltipContent.tsx` (lines 27-47)

Replace the current column-based grid (one row per color, daily/weekly as columns) with a row-based layout (one row per context, all three dots inline):

```
daily:   ● ≤2.5%   ● ≤10%   ● >10%
weekly:  ● under   ● ≤5%    ● >5%
```

### Technical detail

Replace lines 27-47 with two rows, each using an inline layout:

```tsx
<div className="text-[10px] tabular-nums space-y-px">
  <div>
    daily: <span className="text-green-400">●</span> ≤2.5%{' '}
    <span className="text-amber-400">●</span> ≤10%{' '}
    <span className="text-rose-400">●</span> &gt;10%
  </div>
  {weekRollup && weekLabel && (
    <div>
      weekly: <span className="text-green-400">●</span> under{' '}
      <span className="text-amber-400">●</span> ≤5%{' '}
      <span className="text-rose-400">●</span> &gt;5%
    </div>
  )}
</div>
```

The "over" / "over target" suffixes are dropped since context is obvious from the tooltip. The weekly row only renders when rollup data is present.

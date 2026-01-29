
## Fix Chart Title Clipping for Descenders

### Problem
The "g" in "Seated Leg Press" is being cut off because `ChartTitle` uses `leading-none` (line-height: 1.0), which doesn't provide enough vertical space for descender characters (g, y, p, q, j).

### Solution
Increase the line-height on `ChartTitle` from `leading-none` to `leading-tight` (line-height: 1.25) which provides adequate space for descenders without significantly increasing the overall chart header height.

### File to Modify

**src/components/ui/card.tsx** (line 45)

Change:
```tsx
<h4 ref={ref} className={cn("text-xs font-semibold leading-none tracking-tight", className)} {...props} />
```

To:
```tsx
<h4 ref={ref} className={cn("text-xs font-semibold leading-tight tracking-tight", className)} {...props} />
```

### Impact
- Fixes clipping on all chart titles with descender letters
- Minimal visual change (~2-3px extra height per title)
- Consistent typography that properly displays all characters

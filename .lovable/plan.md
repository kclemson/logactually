
## Style fix: calories remaining line in the calorie tooltip

### What's wrong

The current implementation renders the remaining line as a separate block with:
- `font-medium` (bold weight)
- `text-green-400` / `text-rose-400` at full brightness
- A `border-t` divider above it, visually separating it into its own section

This makes it feel like a distinct call-out rather than a natural continuation of the equation.

### What it should look like

A fourth row in the existing equation grid, directly below `= 1,500  adjusted daily calorie target`, matching the same `opacity-75 tabular-nums` style as the other rows:

```
  1,500  (daily calorie target)
+     0  (calories burned from exercise)
= 1,500  adjusted daily calorie target
    122  cal remaining
```

The number is right-aligned in column 1, the label is in column 2 in the same `text-[9px] italic opacity-60` style. The row can carry a subtle color (`text-green-400` or `text-rose-400`) without being bold, so it's readable but not dominant.

### Technical changes

**`src/components/CalorieTargetTooltipContent.tsx`**

Two changes:

1. Remove the standalone `showRemaining` block (the one with `border-t`, `font-medium`, and the IIFE) from `CalorieTargetTooltipContent`.

2. Add `showRemaining` and `intake` as optional props to `TargetEquation`, and render the remaining row inside the existing `grid grid-cols-[auto_1fr]` div, after the `= target` line:

```tsx
{showRemaining && intake !== undefined && target > 0 && (() => {
  const remaining = target - intake;
  const isOver = remaining < 0;
  return (
    <>
      <div className={`text-right ${isOver ? 'text-rose-400' : 'text-green-400'}`}>
        {isOver ? `over ${Math.abs(remaining).toLocaleString()}` : remaining.toLocaleString()}
      </div>
      <div className={`text-[9px] italic opacity-60 ${isOver ? 'text-rose-400' : 'text-green-400'}`}>
        {isOver ? 'cal over target' : 'cal remaining'}
      </div>
    </>
  );
})()}
```

This renders inside the same `grid grid-cols-[auto_1fr] gap-x-2 pl-2 opacity-75 tabular-nums` container, so alignment is automatic.

Pass `showRemaining={showRemaining}` and `intake={intake}` from `CalorieTargetTooltipContent` into the `TargetEquation` call for the daily section only (not the weekly section, where "remaining" makes no sense).

### Files changed

| File | Change |
|---|---|
| `src/components/CalorieTargetTooltipContent.tsx` | Remove standalone remaining block; add `showRemaining` + `intake` props to `TargetEquation`; render remaining as a grid row inside the equation |

No other files need changes — `FoodItemsTable` and `FoodLog` already pass `showRemaining={isToday}` correctly.

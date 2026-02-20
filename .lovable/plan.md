
## Fix "calories remaining" row — no color, symmetric number, full word

### Three specific problems to fix

1. **Color** — `text-green-400` / `text-rose-400` are applied to both the number and label. Green is already used in the legend to mean "within target", so applying it here creates a false signal. Remove it — the row inherits `opacity-75` from the parent grid, same as every other equation row.

2. **Number column format** — when over target, the number is rendered as `over 247`, embedding a word inside the number column. This breaks the right-alignment. Fix: always render `Math.abs(remaining)` in column 1, let column 2 carry the meaning.

3. **Abbreviation** — `cal remaining` / `cal over target` → `calories remaining` / `calories over target`.

### Result

Under target:
```
= 1,500  adjusted daily calorie target
    122  calories remaining
```

Over target:
```
= 1,500  adjusted daily calorie target
    247  calories over target
```

Plain, aligned, no color clash with the legend.

### Technical change

One file, one block — lines 168–181 of `src/components/CalorieTargetTooltipContent.tsx`:

```tsx
{showRemaining && intake !== undefined && target > 0 && (() => {
  const remaining = target - intake;
  const isOver = remaining < 0;
  return (
    <>
      <div className="text-right">
        {Math.abs(remaining).toLocaleString()}
      </div>
      <div className="text-[9px] italic opacity-60">
        {isOver ? 'calories over target' : 'calories remaining'}
      </div>
    </>
  );
})()}
```

### Files changed

| File | Change |
|---|---|
| `src/components/CalorieTargetTooltipContent.tsx` | Remove color classes; `Math.abs(remaining)` in number column; spell out "calories" |

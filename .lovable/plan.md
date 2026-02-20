
## Style fix: calories remaining row — no color, spelled out, symmetric number column

### What's wrong

Lines 168–181 of `TargetEquation`:
- Apply `text-green-400` / `text-rose-400` to both the number and label — color is noisy and clashes with the legend
- Prefix the number with the word `over` when over target (e.g. `over 247`) — breaks the right-aligned number column
- Abbreviate "cal" instead of spelling out "calories"

### What it should look like

```
= 1,500  adjusted daily calorie target
    247  calories over target
```

or

```
= 1,500  adjusted daily calorie target
    122  calories remaining
```

- Number column: always just the plain absolute value, right-aligned — no prefix
- Label column: `calories over target` or `calories remaining` — spelled out
- No color classes — inherits `opacity-75` from the parent grid

### Technical changes

**`src/components/CalorieTargetTooltipContent.tsx`** — lines 168–181 only:

Replace the current block with:

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
| `src/components/CalorieTargetTooltipContent.tsx` | Remove color classes; use `Math.abs(remaining)` in number column; spell out "calories" in label strings |

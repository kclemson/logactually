

# Add "minus" Label to Deficit Input

## Change

**`src/components/CalorieTargetDialog.tsx`** (line ~236)

In the deficit input row, add the word "minus" in muted text to the left of the number input:

```
Current:  Target deficit    [____] cal/day
New:      Target deficit    minus [____] cal/day
```

This is a single line addition: a `<span>` with `text-xs text-muted-foreground` containing "minus" inserted before the `<input>` inside the existing flex container.

This aligns with the equation breakdown below it which already shows `TDEE - deficit = target`.


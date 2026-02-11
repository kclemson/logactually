

## Update Preview Label Format

### Change 1: Parentheses instead of em dash
Update `exerciseLabel` to wrap details in parentheses after the name instead of using an em dash separator.

Before: `Treadmill Run — 17.48 min, 1.5 mi`
After: `Treadmill Run (17.48 min, 1.5 mi)`

### Change 2: Remove "est." from calorie format
Update `formatCalorieBurn` (or wherever the estimate string is built) to drop the "est." suffix since the tilde already conveys approximation.

Before: `~137-301 cal est.`
After: `~137-301 cal`

### Technical Details

**`src/components/CalorieBurnDialog.tsx`** (~line 67):
Change the return from `exerciseLabel` to use parentheses:
```
return details.length ? `${name} (${details.join(', ')})` : name;
```

**`src/lib/calorie-burn.ts`**: Find the `formatCalorieBurn` function and remove the "est." or " est." portion from the output string.

### Files Changed
- `src/components/CalorieBurnDialog.tsx`
- `src/lib/calorie-burn.ts`


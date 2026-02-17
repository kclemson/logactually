

# Tooltip Visual Refinements

## Changes

### 1. Fix inconsistent rose dot color in daily tooltip

The dot on line 268 uses `dotClass` which is derived from `getTargetDotColor`, but the legend dots on lines 271-273 use hardcoded Tailwind classes (`text-rose-400`). The issue is that `dotClass` mapping may produce a different shade. The fix: ensure the dot class derivation is consistent -- the legend dots already use `text-rose-400` directly, so the computed `dotClass` just needs to match. Looking at the code, the mapping is correct (`text-rose-400`), so the pale appearance is likely from the `opacity-75` on the parent div (line 267). Move the result line out of the opacity context or remove opacity from it.

### 2. Move dot next to target number (not end of string)

Change line 253 from:
```
1,521 / 1,585 daily calorie target [dot]
```
To:
```
1,521 / 1,585 [dot] daily calorie target
```

### 3. Smaller, darker, italic text for parenthetical descriptions

In both tooltips, change the parenthetical text column to use `text-[9px] italic opacity-60` (smaller than the current 10px-equivalent tooltip text, and italic). Apply to both `CalorieTargetRollup.tsx` and `History.tsx` equation grids.

## Technical Details

### File: `src/pages/History.tsx`

- Line 253: Move dot to after target number: `{intake} / {target} <dot> daily calorie target`
- Lines 257, 259, 263: Add `text-[9px] italic opacity-60` to parenthetical text divs
- Line 267: Remove `opacity-75` from the result line div so the dot color is full strength
- Lines 271-273: Add `text-[9px]` to legend lines for consistency

### File: `src/components/CalorieTargetRollup.tsx`

- Lines 35, 37, 41: Add `text-[9px] italic opacity-60` to parenthetical text divs in `renderEquationBlock`

### Files Changed
- `src/pages/History.tsx`
- `src/components/CalorieTargetRollup.tsx`


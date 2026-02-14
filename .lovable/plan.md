
## Move "Done" Button Next to Controls

### Problem
"Done" is far right, separated from the stepper controls by a `flex-1` spacer. When the preview text appears/disappears, the gap changes, making "Done" feel disconnected.

### Solution
Place "Done" immediately after the `+` button (before the preview), and move the preview to the end. This way "Done" never moves -- it's always right next to the controls regardless of whether a preview is showing.

Layout at 1x (no preview):
`[-] 1x [+] Done`

Layout at 1.25x (with preview):
`[-] 1.25x [+] Done  (25 baby carrots, 88 cal)`

### Technical Details

**File: `src/components/FoodItemsTable.tsx`**

Reorder the elements inside the stepper div (lines 722-744):

1. Move the "Done" button (lines 728-744) to right after the `+` button (after line 721)
2. Keep the `flex-1` spacer after "Done"
3. Move the preview span to the end (after the spacer), so it right-aligns as secondary info

```
[- button] [multiplier] [+ button] [Done button] [flex-1 spacer] [preview span]
```

"Done" stays fixed next to controls. The preview floats to the right as supplementary info -- it can appear/disappear without shifting anything the user needs to tap.



## Fix: Calorie Burn Dialog Not Dismissable on Small Screens

### Problem

The CalorieBurnDialog contains a lot of content (toggle, preview, biometric inputs, workout defaults, explanatory text). On smaller Android phones, the dialog overflows the viewport vertically. Since `DialogContent` uses `fixed` positioning with `top-[50%] translate-y-[-50%]`, the content extends past the screen edges with no scroll, making the close button (or parts of the dialog) unreachable.

### Solution

Add `max-h-[85vh] overflow-y-auto` to the dialog content so it becomes scrollable when it exceeds the viewport height. This keeps the dialog centered but constrains it to 85% of the viewport, with internal scrolling for overflow.

### Technical Details

**File**: `src/components/CalorieBurnDialog.tsx` (line 310)

Update the `DialogContent` className to add max-height and overflow:

```
Before:
className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"

After:
className="left-2 right-2 translate-x-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4 sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md"
```

This is a single-line change. The `85vh` cap leaves room for the system chrome (status bar, navigation bar) on Android devices, and `overflow-y-auto` enables scrolling only when needed.

| File | Change |
|------|--------|
| `src/components/CalorieBurnDialog.tsx` | Add `max-h-[85vh] overflow-y-auto` to DialogContent |

